import React from 'react';

export function FeatureCard({ icon, title, description, colorVariant = "mint" }) {
  const getColors = () => {
    switch (colorVariant) {
      case "yellow":
        return "bg-tertiary-fixed text-tertiary";
      case "pink":
        return "bg-primary-fixed text-primary";
      case "mint":
      default:
        return "bg-secondary-fixed text-secondary";
    }
  };

  return (
    <div className="bg-surface-container-lowest/90 backdrop-blur-md rounded-3xl p-6 shadow-[0_12px_32px_-4px_rgba(60,45,30,0.06),0_4px_12px_-2px_rgba(60,45,30,0.03)] hover:shadow-[0_18px_40px_-6px_rgba(60,45,30,0.1)] transition-all duration-300 hover:-translate-y-1 flex flex-col items-start border border-white/50">
      <div className={`w-12 h-12 rounded-full ${getColors()} flex items-center justify-center mb-5 shrink-0 shadow-xs`}>
        <span
          className="material-symbols-outlined text-[24px]"
          style={icon === 'favorite' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2 font-medium">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
