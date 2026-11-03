/** Bind requests to the native instance; old windows cannot use a new server. */
let instance: Promise<string> | undefined;

export async function desktopRequest(
  init?: RequestInit,
): Promise<RequestInit | undefined> {
  if (process.env.NEXT_PUBLIC_DESKTOP !== '1' || typeof window === 'undefined')
    return init;
  instance ??= fetch('/api/health', { cache: 'no-store' })
    .then(async (response) => {
      const data = await response.json();
      if (
        !response.ok ||
        data.service !== 'rskits-desktop' ||
        typeof data.instanceId !== 'string' ||
        !data.instanceId
      )
        throw new Error(
          'Não foi possível confirmar a instância do aplicativo. Reabra o RS KITS.',
        );
      return data.instanceId as string;
    })
    .catch((error) => {
      instance = undefined;
      throw error;
    });
  const headers = new Headers(init?.headers);
  headers.set('X-RSKITS-Instance', await instance);
  return { ...init, headers };
}
