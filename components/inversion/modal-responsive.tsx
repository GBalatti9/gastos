'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descripcion?: string
  children: React.ReactNode
  className?: string
}

/** Drawer de abajo en mobile, Dialog centrado en desktop. Mismo contenido. */
export function ModalResponsive({ open, onOpenChange, titulo, descripcion, children, className }: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent className="[--drawer-content-max-height:calc(100dvh-2.5rem)]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{titulo}</DrawerTitle>
            {descripcion && <DrawerDescription>{descripcion}</DrawerDescription>}
          </DrawerHeader>
          <div className={cn('flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]', className)}>
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto sm:max-w-lg', className)}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
