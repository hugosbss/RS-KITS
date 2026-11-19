"""Own the local listener and database lease for the lifetime of this process."""
import json
import os
import socket
import uuid
from pathlib import Path

INSTANCE_ID = uuid.uuid4().hex
ENFORCE_IDENTITY = False


def reserve_listener(port=19090, strict=False):
    listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
    try:
        try:
            listener.bind(("127.0.0.1", port))
        except OSError:
            if strict:
                raise RuntimeError(f"A porta {port} já está em uso. O aplicativo não acessará o servidor de outra instância.") from None
            listener.bind(("127.0.0.1", 0))
        listener.listen(128)
        return listener
    except Exception:
        listener.close()
        raise


def health_matches(response, event_id):
    try:
        data = json.load(response)
        return data.get("service") == "rskits-desktop" and data.get("instanceId") == INSTANCE_ID and data.get("eventId") == event_id
    except (ValueError, TypeError):
        return False


class ProfileLease:
    """OS-managed lock: released even after a crash; no stale PID decisions."""
    def __init__(self, database_dir):
        Path(database_dir).mkdir(parents=True, exist_ok=True)
        self.file = open(Path(database_dir) / ".runtime.lock", "a+b")
        self.file.seek(0)
        if os.fstat(self.file.fileno()).st_size == 0:
            self.file.write(b"0")
            self.file.flush()
        self.file.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(self.file.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            self.file.close()
            raise RuntimeError("Este banco já está aberto em outra instância. Feche a outra janela antes de continuar.") from None

    def close(self):
        if not self.file.closed:
            self.file.close()


def show_startup_error(error, interactive=True):
    message = f"Não foi possível abrir o RS KITS.\n\n{error}"
    if os.name == "nt" and interactive:
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, message, "RS KITS", 0x10)
    else:
        print(message)
