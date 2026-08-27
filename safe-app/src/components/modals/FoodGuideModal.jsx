import React, { useState } from 'react';
import { Coffee, Utensils, Apple, Info } from 'lucide-react';
import './FoodGuideModal.css';

const MEAL_DATA = {
  1: [
    { type: 'Breakfast', name: 'Warm Oatmeal with Berries', icon: <Coffee size={24} />, nutrients: 'Vitamin C, Antioxidants', benefits: 'Reduces inflammation' },
    { type: 'Lunch', name: 'Chicken Soup with Garlic', icon: <Utensils size={24} />, nutrients: 'Protein, Allicin', benefits: 'Thins mucus, antibacterial' },
    { type: 'Dinner', name: 'Baked Salmon with Asparagus', icon: <Utensils size={24} />, nutrients: 'Omega-3', benefits: 'Reduces sinus swelling' }
  ],
  2: [
    { type: 'Breakfast', name: 'Ginger Tea & Avocado Toast', icon: <Coffee size={24} />, nutrients: 'Gingerol, Healthy Fats', benefits: 'Soothes throat, anti-inflammatory' },
    { type: 'Lunch', name: 'Quinoa Salad with Citrus', icon: <Apple size={24} />, nutrients: 'Vitamin C, Fiber', benefits: 'Boosts immune system' },
    { type: 'Dinner', name: 'Turmeric Chicken Curry', icon: <Utensils size={24} />, nutrients: 'Curcumin', benefits: 'Powerful natural anti-inflammatory' }
  ],
  // Fallback for days 3-7 for demo purposes
  default: [
    { type: 'Breakfast', name: 'Green Smoothie (Spinach, Pineapple)', icon: <Coffee size={24} />, nutrients: 'Bromelain, Vitamin C', benefits: 'Breaks down mucus' },
    { type: 'Lunch', name: 'Bone Broth with Veggies', icon: <Utensils size={24} />, nutrients: 'Minerals, Amino Acids', benefits: 'Supports respiratory health' },
    { type: 'Dinner', name: 'Grilled Turkey & Sweet Potato', icon: <Utensils size={24} />, nutrients: 'Vitamin A, Protein', benefits: 'Maintains healthy mucous membranes' }
  ]
};

const getImagePath = (day, type) => {
  if (type === 'Breakfast') {
    return `/I2ASPO/Day ${day}/${day === 2 ? 'Breakfast' : 'Breakfast_'}.jpg`;
  }
  return `/I2ASPO/Day ${day}/${type}.jpg`;
};

const FoodGuideModal = () => {
  const [activeDay, setActiveDay] = useState(1);
  const days = [1, 2, 3, 4, 5, 6, 7];

  const currentMeals = MEAL_DATA[activeDay] || MEAL_DATA.default;

  return (
    <div className="food-modal">
      <div className="food-header text-center">
        <h2>Healthy Food Guide</h2>
        <p className="text-light">Discover nutritious food choices that may support better sinus health.</p>
      </div>

      <div className="days-tabs">
        {days.map(day => (
          <button 
            key={day} 
            className={`tab-btn ${activeDay === day ? 'active' : ''}`}
            onClick={() => setActiveDay(day)}
          >
            Day {day}
          </button>
        ))}
      </div>

      <div className="meals-container animate-fade-in" key={activeDay}>
        {currentMeals.map((meal, index) => (
          <div key={index} className="meal-card card">
            <div className="meal-image-wrapper">
              <img src={getImagePath(activeDay, meal.type)} alt={meal.name} className="meal-image" />
            </div>
            <div className="meal-details">
              <span className="meal-type">{meal.type}</span>
              <h3>{meal.name}</h3>
              <div className="meal-info">
                <div className="info-badge nutrients">
                  <strong>Nutrients:</strong> {meal.nutrients}
                </div>
                <div className="info-badge benefits">
                  <Info size={14} />
                  <strong>Benefits:</strong> {meal.benefits}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodGuideModal;
