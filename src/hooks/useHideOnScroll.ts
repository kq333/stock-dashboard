import { useEffect, useRef, useState } from 'react'

const SCROLL_THRESHOLD = 8
const TOP_OFFSET = 16

type HideOnScrollOptions = {
  showOnScrollUp?: boolean
  topOffset?: number
}

export const useHideOnScroll = ({
  showOnScrollUp = true,
  topOffset = TOP_OFFSET,
}: HideOnScrollOptions = {}) => {
  const [isHidden, setIsHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const scrollContainer = document.getElementById('page-content')
    const scrollTarget = scrollContainer ?? window
    const getScrollY = () => Math.max(0, scrollContainer?.scrollTop ?? window.scrollY)

    lastScrollY.current = getScrollY()
    let animationFrame: number | undefined

    const updateVisibility = () => {
      const currentScrollY = getScrollY()
      const scrollDifference = currentScrollY - lastScrollY.current

      if (!showOnScrollUp) {
        setIsHidden(currentScrollY > topOffset)
      } else if (currentScrollY <= topOffset) {
        setIsHidden(false)
        lastScrollY.current = currentScrollY
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

    handleScroll()
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll)

      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [showOnScrollUp, topOffset])

  return isHidden
}
