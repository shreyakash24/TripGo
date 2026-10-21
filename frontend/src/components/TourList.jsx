import React from "react";
import { motion } from "framer-motion";
import tourData from "../assets/data/tour.js";
import TourCard from "../components/TourCard.jsx";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const TourList = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {tourData.map((tour, index) => (
        <motion.div
          key={index}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.2 }}
        >
          <TourCard tour={tour} />
        </motion.div>
      ))}
    </div>
  );
};

export default TourList;
