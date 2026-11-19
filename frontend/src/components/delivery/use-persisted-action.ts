import { useEffect, useRef, useState } from 'react';

/** A delivery is visible as successful only after its durable write succeeds. */
export function usePersistedAction(eventId?: string) {
  const running = useRef(false);
  const mounted = useRef(true);
  const currentEvent = useRef(eventId);
  currentEvent.current = eventId;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setError(null);
  }, [eventId]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const execute = async (
    write: () => Promise<unknown>,
    onSaved: () => void,
  ) => {
    if (running.current) return;
    const startedEvent = currentEvent.current;
    running.current = true;
    setSaving(true);
    setError(null);
    try {
      await write();
      if (mounted.current && currentEvent.current === startedEvent) onSaved();
    } catch (cause) {
      if (mounted.current && currentEvent.current === startedEvent)
        setError(
          `A operação não foi concluída. ${cause instanceof Error ? cause.message : 'Confira os dados e tente novamente.'}`,
        );
    } finally {
      running.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  return { execute, saving, error };
}
