'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BriefingCardProps {
  briefing: string
  title?: string
}

export function BriefingCard({ briefing, title = 'Briefing gerado por IA' }: BriefingCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
          <Sparkles className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h2 className="text-sm font-bold mt-3 mb-1 first:mt-0 text-foreground">{children}</h2>
            ),
            h2: ({ children }) => (
              <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 className="text-xs font-semibold mt-2 mb-0.5 text-foreground">{children}</h4>
            ),
            p: ({ children }) => (
              <p className="text-xs text-muted-foreground mb-2 last:mb-0 leading-relaxed">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-0.5 mb-2 text-xs text-muted-foreground pl-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-0.5 mb-2 text-xs text-muted-foreground pl-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-xs text-muted-foreground leading-relaxed">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            table: ({ children }) => (
              <div className="overflow-x-auto mb-2 rounded border border-border/60">
                <table className="text-xs border-collapse w-full">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
            th: ({ children }) => (
              <th className="border-b border-border px-3 py-1.5 text-left font-semibold text-foreground whitespace-nowrap">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-border/40 px-3 py-1.5 text-muted-foreground">
                {children}
              </td>
            ),
            tr: ({ children }) => <tr className="last:[&>td]:border-b-0">{children}</tr>,
            code: ({ children }) => (
              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{children}</code>
            ),
            hr: () => <hr className="my-2 border-border/50" />,
          }}
        >
          {briefing}
        </ReactMarkdown>
      </CardContent>
    </Card>
  )
}
