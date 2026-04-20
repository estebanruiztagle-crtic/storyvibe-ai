'use client'

import { motion } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
}

export default function StepTransition({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`mx-auto w-full max-w-4xl px-6 py-8 ${className}`}
    >
      {children}
    </motion.div>
  )
}
