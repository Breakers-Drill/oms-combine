import React, { useCallback, useRef, useState, useEffect } from 'react';

interface SpawnOptions {
  shell?: boolean;
  cwd?: string;
  env?: Record<string, string>;
  stdio?: any;
  detached?: boolean;
  uid?: number;
  gid?: number;
}

type MessageEventData = 
  | { channel: 'stdout'; chunk: string }
  | { channel: 'stderr'; chunk: string }
  | { channel: 'close'; code: number }
  | { channel: 'exit'; code: number }
  | { channel: 'error'; error: unknown };

function buildApiUrl(baseUrl: string | undefined, path: string, params: Record<string, string>): string {
  const normalizedBase = (baseUrl ?? '').replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${normalizedBase}${normalizedPath}`;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

function useSse(url: string | null) {
  const [events, setEvents] = useState<MessageEventData[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const start = useCallback(() => {
    if (!url) {
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsRunning(true);

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (ev) => {
      try {
        const eventData: MessageEventData = JSON.parse(ev.data);
        setEvents((prev) => [...prev, eventData]);
      } catch (error) {
        console.error('Failed to parse SSE event data:', error);
      }
    };

    es.onerror = (error) => {
      es.close();
      setIsRunning(false);
    };

  }, [url]);

  const stop = useCallback(() => {
    eventSourceRef.current?.close();
    setIsRunning(false);
  }, []);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  return { events, isRunning, start, stop, clear };
}

function getEventColor(channel: MessageEventData['channel']): string {
  switch (channel) {
    case 'stdout':
      return '#86efac'; // light green
    case 'stderr':
      return '#fde047'; // light amber
    case 'close':
      return '#93c5fd'; // light blue
    case 'error':
      return '#fca5a5'; // light red
    case 'exit':
      return '#c4b5fd'; // light purple
    default:
      return '#d1d5db'; // light gray
  }
}

function getEventPrefix(channel: MessageEventData['channel']): string {
  switch (channel) {
    case 'stdout':
      return '[STDOUT]';
    case 'stderr':
      return '[STDERR]';
    case 'close':
      return '[CLOSE]';
    case 'error':
      return '[ERROR]';
    case 'exit':
      return '[EXIT]';
    default:
      return '[UNKNOWN]';
  }
}



export function App() {
  const [cmd, setCmd] = useState<string>('docker ps');
  const [spawnOptions, setSpawnOptions] = useState<SpawnOptions>({
    shell: false,
    cwd: '/',
  });
  const [isSpawnOptionsExpanded, setIsSpawnOptionsExpanded] = useState(false);

  const engineBaseUrl = import.meta.env.VITE_ENGINE_URL;



  const buildParams = useCallback(() => {
    const params: Record<string, string> = { cmd };

    if (spawnOptions.shell !== undefined) {
      params.shell = spawnOptions.shell.toString();
    }
    if (spawnOptions.cwd) {
      params.cwd = spawnOptions.cwd;
    }
    if (spawnOptions.detached !== undefined) {
      params.detached = spawnOptions.detached.toString();
    }
    if (spawnOptions.uid !== undefined) {
      params.uid = spawnOptions.uid.toString();
    }
    if (spawnOptions.gid !== undefined) {
      params.gid = spawnOptions.gid.toString();
    }
    if (spawnOptions.env) {
      params.env = JSON.stringify(spawnOptions.env);
    }
    if (spawnOptions.stdio) {
      params.stdio = JSON.stringify(spawnOptions.stdio);
    }

    return params;
  }, [cmd, spawnOptions]);

  const apiUrl = buildApiUrl(engineBaseUrl, '/api/exec', buildParams());
  const sse = useSse(apiUrl);

  const onRun = useCallback(() => {
    if (!cmd.trim()) {
      return;
    }
    sse.start();
  }, [cmd, sse]);

  const onStop = useCallback(() => {
    sse.stop();
  }, [sse]);

  const onClear = useCallback(() => {
    sse.clear();
  }, [sse]);

  const updateSpawnOption = useCallback((key: keyof SpawnOptions, value: any) => {
    setSpawnOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace' }}>
      <h1>Terminal-like UI</h1>

            {/* SpawnOptions - сворачиваемая секция */}
      <div style={{
        marginBottom: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#f9fafb'
      }}>
        {/* Заголовок с кнопкой сворачивания */}
        <div 
          onClick={() => setIsSpawnOptionsExpanded(!isSpawnOptionsExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            cursor: 'pointer',
            borderBottom: isSpawnOptionsExpanded ? '1px solid #e5e7eb' : 'none'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            Spawn Options
          </h3>
          <span style={{ 
            fontSize: '18px', 
            transition: 'transform 0.2s',
            transform: isSpawnOptionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </div>

        {/* Содержимое секции */}
        {isSpawnOptionsExpanded && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '14px' }}>
                Shell:
              </label>
              <select
                value={spawnOptions.shell?.toString() || ''}
                onChange={(e) => updateSpawnOption('shell', e.target.value === 'true')}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontFamily: 'inherit',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Default (false)</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '14px' }}>
                Working Directory (cwd):
              </label>
              <input
                value={spawnOptions.cwd || ''}
                onChange={(e) => updateSpawnOption('cwd', e.target.value)}
                placeholder="/path/to/directory"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontFamily: 'inherit',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '14px' }}>
                Detached:
              </label>
              <select
                value={spawnOptions.detached?.toString() || ''}
                onChange={(e) => updateSpawnOption('detached', e.target.value === 'true')}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontFamily: 'inherit',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Default (false)</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '14px' }}>
                User ID (uid):
              </label>
              <input
                type="number"
                value={spawnOptions.uid || ''}
                onChange={(e) => updateSpawnOption('uid', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="1000"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontFamily: 'inherit',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '14px' }}>
                Group ID (gid):
              </label>
              <input
                type="number"
                value={spawnOptions.gid || ''}
                onChange={(e) => updateSpawnOption('gid', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="1000"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontFamily: 'inherit',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '14px' }}>
                Environment Variables (env):
              </label>
              <textarea
                value={spawnOptions.env ? JSON.stringify(spawnOptions.env, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                    updateSpawnOption('env', parsed);
                  } catch {
                    // Invalid JSON, keep the text but don't update the object
                  }
                }}
                placeholder='{"NODE_ENV": "production"}'
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '0.5rem',
                  fontFamily: 'inherit',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '14px' }}>
                Standard I/O (stdio):
              </label>
              <textarea
                value={spawnOptions.stdio ? JSON.stringify(spawnOptions.stdio, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                    updateSpawnOption('stdio', parsed);
                  } catch {
                    // Invalid JSON, keep the text but don't update the object
                  }
                }}
                placeholder='["pipe", "pipe", "pipe"]'
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '0.5rem',
                  fontFamily: 'inherit',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Command Line */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Command Line:
        </label>
                 <input
           value={cmd}
           onChange={(e) => setCmd(e.target.value)}
           placeholder="git status | docker ps"
           style={{
             width: '100%',
             padding: '0.5rem',
             fontFamily: 'inherit',
             border: '1px solid #ccc',
             borderRadius: '4px',
             boxSizing: 'border-box'
           }}
         />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={onRun}
          disabled={!cmd.trim() || sse.isRunning}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: sse.isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {sse.isRunning ? 'Running...' : 'Run'}
        </button>
        <button
          onClick={onStop}
          disabled={!sse.isRunning}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: sse.isRunning ? 'pointer' : 'not-allowed'
          }}
        >
          Stop
        </button>
        <button
          onClick={onClear}
          disabled={sse.events.length === 0}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: sse.events.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Clear Log
        </button>
      </div>

      {/* Event Type Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1rem', 
        padding: '0.5rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <span style={{ color: getEventColor('stdout') }}>● STDOUT</span>
        <span style={{ color: getEventColor('stderr') }}>● STDERR</span>
        <span style={{ color: getEventColor('close') }}>● CLOSE</span>
        <span style={{ color: getEventColor('error') }}>● ERROR</span>
        {/* <span style={{ color: getEventColor('exit') }}>● EXIT</span> */}
      </div>

                           {/* Log Output */}
        <div style={{
          background: '#0a0a0a',
          color: '#e2e8f0',
          padding: '1rem',
          borderRadius: 8,
          minHeight: 300,
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto 1fr',
            gap: '0.1rem 0.5rem',
            alignItems: 'start',
            whiteSpace: 'pre-wrap',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
            fontSize: '14px'
          }}>
            {sse.events.length === 0 ? (
              <div style={{ gridColumn: '1 / -1' }}>
                {sse.isRunning ? 'Running…' : 'Output will appear here'}
              </div>
            ) : (
              sse.events.map((event, index) => {
                const eventColor = getEventColor(event.channel);
                return (
                  <React.Fragment key={index}>
                    <span style={{ color: eventColor }}>
                      {getEventPrefix(event.channel)}
                    </span>
                    <span style={{ color: eventColor }}>
                      {new Date().toLocaleTimeString()}
                    </span>
                    <span style={{ color: eventColor }}>
                      {'chunk' in event ? event.chunk : 
                       'code' in event ? event.code.toString() :
                       'error' in event ? typeof event.error == "object" ? JSON.stringify(event.error) : String(event.error) : 
                       'Unknown event'}
                    </span>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

      <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '12px' }}>
        <p><strong>Current API URL:</strong></p>
        <code style={{
          display: 'block',
          background: '#f1f5f9',
          padding: '0.5rem',
          borderRadius: '4px',
          wordBreak: 'break-all',
          fontSize: '11px'
        }}>
          {apiUrl}
        </code>
      </div>
    </div>
  );
}

