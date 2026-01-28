/**
 * LegalContent Component
 *
 * Renders legal document content with proper formatting.
 * Supports structured legal content with sections and subsections.
 */

import type { ReactNode } from 'react'

export interface LegalSection {
  id: string
  title: string
  content: string | ReactNode
  subsections?: Array<{
    id: string
    title: string
    content: string | ReactNode
  }>
}

interface LegalContentProps {
  sections: LegalSection[]
  lastUpdated: string
  version: string
}

export function LegalContent({ sections, lastUpdated, version }: LegalContentProps) {
  return (
    <div className="space-y-8">
      {/* Meta info */}
      <div className="text-[13px] text-[#777] space-y-1">
        <p>Last Updated: {lastUpdated}</p>
        <p>Version: {version}</p>
      </div>

      {/* Table of Contents */}
      <div className="p-4 bg-[#111] rounded-xl border border-[#333]">
        <h2 className="text-[14px] font-semibold text-white mb-3">Table of Contents</h2>
        <nav className="space-y-2">
          {sections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block text-[13px] text-[#00ba7c] hover:underline"
            >
              {index + 1}. {section.title}
            </a>
          ))}
        </nav>
      </div>

      {/* Sections */}
      {sections.map((section, index) => (
        <section key={section.id} id={section.id} className="scroll-mt-20">
          <h2 className="text-[17px] font-semibold text-white mb-3">
            {index + 1}. {section.title}
          </h2>
          <div className="text-[14px] text-[#ccc] leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>

          {/* Subsections */}
          {section.subsections?.map((sub, subIndex) => (
            <div key={sub.id} id={sub.id} className="mt-4 pl-4 border-l-2 border-[#333]">
              <h3 className="text-[15px] font-medium text-white mb-2">
                {index + 1}.{subIndex + 1} {sub.title}
              </h3>
              <div className="text-[14px] text-[#aaa] leading-relaxed whitespace-pre-wrap">
                {sub.content}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

export function LegalHighlight({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 p-4 bg-[#ff304010] border border-[#ff304030] rounded-lg">
      <p className="text-[14px] text-[#ff6060]">{children}</p>
    </div>
  )
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="my-2 space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[14px] text-[#ccc]">
          <span className="text-[#00ba7c] mt-1">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
