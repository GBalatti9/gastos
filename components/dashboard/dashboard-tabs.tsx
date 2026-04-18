'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Calendar, BarChart3 } from 'lucide-react'

interface Props {
  mesContent: React.ReactNode
  totalContent: React.ReactNode
}

export function DashboardTabs({ mesContent, totalContent }: Props) {
  return (
    <Tabs defaultValue="mes">
      <TabsList className="w-full">
        <TabsTrigger value="mes">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          Este Mes
        </TabsTrigger>
        <TabsTrigger value="total">
          <BarChart3 className="h-3.5 w-3.5 mr-1" />
          Total
        </TabsTrigger>
      </TabsList>

      <TabsContent value="mes">
        <div className="space-y-4 pt-2">
          {mesContent}
        </div>
      </TabsContent>

      <TabsContent value="total">
        <div className="space-y-4 pt-2">
          {totalContent}
        </div>
      </TabsContent>
    </Tabs>
  )
}
