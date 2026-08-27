import React from 'react';
import { Play, PlayCircle } from 'lucide-react';
import './ArticlesModal.css';

const ARTICLES = [
  {
    id: 1,
    title: "Yoga for Sinus & Cold Relief",
    description: "Explore simple yoga exercises that may help support breathing and relieve nasal discomfort.",
    url: "https://youtu.be/D4ehqHN586c?si=GYpT4qU8iuf-4-WX",
    embedUrl: "https://www.youtube.com/embed/D4ehqHN586c",
    thumbnailColor: "var(--accent)"
  },
  {
    id: 2,
    title: "How to Use a Sinus Rinse",
    description: "Learn the correct way to perform a sinus rinse for better nasal hygiene.",
    url: "https://youtu.be/l2K39NL798M?si=aFqgCSOq7V6nC7rZ",
    embedUrl: "https://www.youtube.com/embed/l2K39NL798M",
    thumbnailColor: "var(--success)"
  },
  {
    id: 3,
    title: "What Causes Sinusitis?",
    description: "Learn about the common causes and basic mechanisms of sinusitis through an easy-to-understand explanation.",
    url: "https://youtu.be/FGka4QxuZME?si=85L9Y1PD5v5eURhx",
    embedUrl: "https://www.youtube.com/embed/FGka4QxuZME",
    thumbnailColor: "var(--warning)"
  }
];

const ArticlesModal = () => {
  return (
    <div className="articles-modal">
      <div className="articles-header text-center">
        <h2>Sinusitis Articles</h2>
        <p className="text-light">Explore trusted articles about sinusitis, from symptoms and causes to prevention and treatment.</p>
      </div>

      <div className="articles-grid">
        {ARTICLES.map((article, index) => (
          <div key={article.id} className="article-card card animate-fade-in" style={{ animationDelay: `${index * 0.15}s` }}>
            <div className="article-video-wrapper">
              <iframe 
                src={article.embedUrl} 
                title={article.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="article-iframe"
              ></iframe>
            </div>
            <div className="article-content">
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full mt-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <Play size={16} /> Watch Video
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlesModal;
