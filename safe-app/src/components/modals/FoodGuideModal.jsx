import React, { useState } from 'react';
import { Coffee, Utensils, Apple, Info } from 'lucide-react';
import './FoodGuideModal.css';

const MEAL_DATA = {
  1: [
    { type: 'Breakfast', name: 'Warm Oatmeal with Berries', icon: <Coffee size={24} />, nutrients: 'Vitamin C, Antioxidants', benefits: 'Reduces inflammation' },
    { type: 'Lunch', name: 'Chicken Soup with Garlic', icon: <Utensils size={24} />, nutrients: 'Protein, Allicin', benefits: 'Thins mucus, antibacterial' },
    { type: 'Dinner', name: 'Grilled Mackarel with Stir-fried Chinese Cabbage.', icon: <Utensils size={24} />, nutrients: 'Omega-3', benefits: 'Reduced inflammation.' }
  ],
  2: [
    { type: 'Breakfast', name: 'Turmeric Omelete with Warm White Rice.', icon: <Coffee size={24} />, nutrients: 'Complete protein.', benefits: 'Build strong immune.' },
    { type: 'Lunch', name: 'Clear Basil Fish Soup.', icon: <Utensils size={24} />, nutrients: 'Lean protein, gingerol.', benefits: 'Sooth respitory tract.' },
    { type: 'Dinner', name: 'Steamed Tofu in Banana Leaf.', icon: <Utensils size={24} />, nutrients: 'Isoflanoves, Curcumin.', benefits: 'High antioxidant, content neutralizes free radicals.' }
  ],
  3: [
    { type: 'Breakfast', name: 'Banana-Pineapple smoothie.', icon: <Coffee size={24} />, nutrients: 'Bromelain, Vitamin C', benefits: 'Breaks down mucus' },
    { type: 'Lunch', name: 'Clear Soto Ayam', icon: <Utensils size={24} />, nutrients: 'Vitamin C, Protein.', benefits: 'Reduces tissue pressure around the cheek' },
    { type: 'Dinner', name: 'Pan Seared Tilapia with Stir-fried Bok Choy.', icon: <Utensils size={24} />, nutrients: 'Vitamin K, Vitamin C', benefits: 'Speed up celular repair of damaged respiratory' }
  ],
  4: [
    { type: 'Breakfast', name: 'Red Ginger Tea.', icon: <Coffee size={24} />, nutrients: 'Natural antioxidants', benefits: 'Keeps the thorat hydrated.' },
    { type: 'Lunch', name: 'Clear Chayote and Carrot Soup with Chicken Feet and White Rice.', icon: <Utensils size={24} />, nutrients: 'Natural collagen, allicin and Minerals.', benefits: 'Heals damaged mucus membranes' },
    { type: 'Dinner', name: 'Shredded Steamed Kembung Fish with Mild Chili Herbs and White Rice.', icon: <Utensils size={24} />, nutrients: 'Omega-3, fatty acids, Magnesium.', benefits: 'Safely open blocked airways' }
  ],
  5: [
    { type: 'Breakfast', name: 'Two Boiled Eggs, Steamed Warm Sweet Potato, Fresh Pineapple.', icon: <Coffee size={24} />, nutrients: 'Complete Protein, Bromelaine enzyme.', benefits: 'Break down sticky snot.' },
    { type: 'Lunch', name: 'Clear Luffa (Oyong) Soup with Vermicelli.', icon: <Utensils size={24} />, nutrients: 'Allicin, Vitamin A.', benefits: 'Relieve Feverish Sensation' },
    { type: 'Dinner', name: 'Grillled Gourami with Turmeric Paste.', icon: <Utensils size={24} />, nutrients: 'Protein, fiber, folate.', benefits: 'Block inflammatory pathway' }
  ],
  6: [
    { type: 'Breakfast', name: 'Mango-Pineapple Smoothie. (Made with Pure Water)', icon: <Coffee size={24} />, nutrients: 'Vitamin C and Potassium', benefits: 'Immune booster.' },
    { type: 'Lunch', name: 'Clear Beef Soup', icon: <Utensils size={24} />, nutrients: 'Active antioxidant, Zinc.', benefits: 'Clears heavy nassal congestion.' },
    { type: 'Dinner', name: 'Baked Milkfish (Bandeng) with Stir-fried Garlic Green Bean.', icon: <Utensils size={24} />, nutrients: 'High omega-3, Allicin.', benefits: 'Protects the respiratory system' }
  ],
  7: [
    { type: 'Breakfast', name: 'Warm Black Glutinous Rice Porridge (with Ginger and Honey.)', icon: <Coffee size={24} />, nutrients: 'Gingerol and Iron', benefits: 'Repair cellular damage' },
    { type: 'Lunch', name: 'Clear Fish Ball Soup with Celery and White Rice.', icon: <Utensils size={24} />, nutrients: 'Clean Protein, Allicin.', benefits: 'Natural anti-inflammatory' },
    { type: 'Dinner', name: 'Roasted Turmeric Chicken and Stir-fried Chayote.', icon: <Utensils size={24} />, nutrients: 'Curcumin, Lean Protein.', benefits: 'Supports total muscle recovery' }
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

  const currentMeals = MEAL_DATA[activeDay] || [];

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
