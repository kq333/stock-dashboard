import { useEffect, useRef, useState } from 'react'

const SCROLL_THRESHOLD = 8
const TOP_OFFSET = 16

export const useHideOnScroll = () => {
  const [isHidden, setIsHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    lastScrollY.current = window.scrollY
    let animationFrame: number | undefined

    const updateVisibility = () => {
      const currentScrollY = window.scrollY
      const scrollDifference = currentScrollY - lastScrollY.current

      if (currentScrollY <= TOP_OFFSET) {
        setIsHidden(false)
      } else if (Math.abs(scrollDifference) >= SCROLL_THRESHOLD) {
        setIsHidden(scrollDifference > 0)
        lastScrollY.current = currentScrollY
      }

      animationFrame = undefined
    }

    const handleScroll = () => {
      if (animationFrame === undefined) {
        animationFrame = window.requestAnimationFrame(updateVisibility)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)

      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return isHidden
}
