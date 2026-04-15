import { useEffect, useRef } from 'react';
import { useClashStore } from '@/store';
import * as api from '@/api';

export function BottomBar() {
  const { status, isRunning, setStatus } = useClashStore();
  const lastTraffic = useRef({ up: 0, down: 0 });
  const lastTime = useRef(Date.now());

  useEffect(() => {
    if (!isRunning) return;

    const fetchTraffic = async () => {
      try {
        const traffic = await api.getClashTraffic();
        const now = Date.now();
        const timeDiff = (now - lastTime.current) / 1000;

        if (timeDiff > 0) {
          const upSpeed = (traffic.up - lastTraffic.current.up) / timeDiff;
          const downSpeed = (traffic.down - lastTraffic.current.down) / timeDiff;
          setStatus({
            upload_speed: Math.max(0, upSpeed),
            download_speed: Math.max(0, downSpeed),
          });
        }

        lastTraffic.current = traffic;
        lastTime.current = now;
      } catch {}
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return `${(bytesPerSec / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <footer className="h-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="font-medium">{formatSpeed(status.download_speed)}</span>
        </span>
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8V4m0 0L13 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="font-medium">{formatSpeed(status.upload_speed)}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">{status.delay}ms</span>
        </span>
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className="font-medium">{status.ip || '未连接'}</span>
          {status.location && <span className="text-gray-400">({status.location})</span>}
        </span>
      </div>
    </footer>
  );
}
