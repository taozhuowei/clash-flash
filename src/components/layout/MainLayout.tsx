import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { useAppStore } from '@/store';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { currentPage } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <TopBar />
      <motion.main
        key={currentPage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-auto"
      >
        {children}
      </motion.main>
      <BottomBar />
    </div>
  );
}
