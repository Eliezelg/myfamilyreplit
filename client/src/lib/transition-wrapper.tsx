
import React, { Suspense, startTransition, useState, useTransition } from 'react';

interface TransitionWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TransitionWrapper({ children, fallback = <div>Chargement...</div> }: TransitionWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

export function useTransitionEffect() {
  const [isPending, startTransitionFn] = useTransition();
  
  const runWithTransition = (callback: () => void) => {
    startTransition(() => {
      callback();
    });
  };
  
  return { isPending, runWithTransition };
}
