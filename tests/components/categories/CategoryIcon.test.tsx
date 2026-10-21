import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { CategoryIcon } from '../../../src/components/categories/CategoryIcon'
import { ALLOWED_ICONS } from '../../../src/constants/categoryAppearance'

describe('CategoryIcon', () => {
  it('renders correctly for all allowed icons', () => {
    for (const icon of ALLOWED_ICONS) {
      const { container, unmount } = render(<CategoryIcon iconName={icon} />)
      // Lucide icons render as an SVG
      expect(container.querySelector('svg')).toBeInTheDocument()
      unmount()
    }
  })

  it('renders a fallback icon for unknown icon names', () => {
    const { container } = render(<CategoryIcon iconName="unknown-weird-icon" />)
    // HelpCircle (fallback) will render
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
