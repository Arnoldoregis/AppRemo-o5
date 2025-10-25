import React, { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';

interface CountdownTimerProps {
  targetDate: string; // ISO 8601 format string e.g., "2025-07-29T14:00:00"
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    try {
        const target = parseISO(targetDate);
        const difference = +target - +new Date();
        let timeLeft = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    } catch (error) {
        console.error("Invalid date format for countdown:", targetDate);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const hasTimeLeft = Object.values(timeLeft).some(val => val > 0);

  const renderSegment = (value: number, label: string) => (
    <div className="text-center">
      <span className="font-bold text-lg leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="block text-xs capitalize text-red-700">{label}</span>
    </div>
  );

  return (
    <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
      <p className="text-center text-xs font-semibold text-red-700 mb-1">Tempo Restante para Solicitação</p>
      {hasTimeLeft ? (
        <div className="flex justify-center gap-3 text-red-800">
          {timeLeft.days > 0 && renderSegment(timeLeft.days, 'dias')}
          {renderSegment(timeLeft.hours, 'hrs')}
          {renderSegment(timeLeft.minutes, 'min')}
          {renderSegment(timeLeft.seconds, 'seg')}
        </div>
      ) : (
        <p className="text-center font-bold text-red-800">Horário Atingido</p>
      )}
    </div>
  );
};

export default CountdownTimer;
