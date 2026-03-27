"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBatchStore } from '../hooks/use-batch-store';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BatchProgressHUD() {
  const { isProcessing, total, current, itemName, isSuccess, reset } = useBatchStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isProcessing) {
      setShow(true);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(reset, 500); // Wait for exit animation
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, reset]);

  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, x: '-50%', opacity: 0, scale: 0.95 }}
          animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
          className="fixed top-8 left-1/2 z-[9999] w-[90vw] max-w-[400px]"
        >
          <div className={cn(
            "bg-card border-2 shadow-sm rounded-lg overflow-hidden transition-colors duration-500",
            isSuccess ? "border-emerald-500/50" : "border-border"
          )}>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-500",
                    isSuccess ? "bg-emerald-500 text-white" : "bg-muted/10 text-muted-foreground"
                  )}>
                    {isSuccess ? <Check className="w-4 h-4" strokeWidth={3} /> : <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">
                      {isSuccess ? '¡Registro Completado!' : 'Creando en Segundo Plano'}
                    </h4>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                      {isSuccess ? `${total} ${itemName} listos para usar` : `${current} de ${total} ${itemName} procesados`}
                    </p>
                  </div>
                </div>
                
                {!isSuccess && (
                  <span className="text-[11px] font-black text-foreground tabular-nums">
                    {Math.round(percentage)}%
                  </span>
                )}
              </div>

              {/* Progress Bar Container */}
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden flex shadow-none border border-black/5 dark:border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ ease: "easeInOut", duration: 0.5 }}
                  className={cn(
                    "h-full transition-colors duration-500",
                    isSuccess ? "bg-emerald-500" : "bg-primary"
                  )}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
