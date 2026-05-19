"use client";

import { motion } from "framer-motion";

export default function LotusBloom() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 4, ease: "easeInOut" }}
      className="relative flex items-center justify-center w-64 h-64"
    >
      <div className="absolute inset-0 bg-sacred-blush/20 blur-[80px] rounded-full animate-soft-breathe" />
      
      {/* Simple stylized lotus petals using motion.svg */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full fill-sacred-blush"
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <motion.path
            key={i}
            initial={{ rotate: angle, scale: 0.5, opacity: 0 }}
            animate={{ rotate: angle, scale: 1, opacity: 0.8 }}
            transition={{
              duration: 3,
              delay: i * 0.1,
              ease: "easeOut",
            }}
            d="M50 50 Q70 20 50 10 Q30 20 50 50"
            className="origin-center"
          />
        ))}
        <motion.circle
          cx="50"
          cy="50"
          r="8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="fill-spiritual-gold shadow-lg"
        />
      </svg>
    </motion.div>
  );
}
