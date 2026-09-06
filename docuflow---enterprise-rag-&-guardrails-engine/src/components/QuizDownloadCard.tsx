import React from 'react';
import { GoogleFormQuizCard } from './GoogleFormQuizCard';

interface QuizDownloadCardProps {
  quizContent: string;
  sourceDocTitle?: string;
}

export const QuizDownloadCard: React.FC<QuizDownloadCardProps> = ({
  quizContent,
  sourceDocTitle = 'Document',
}) => {
  return (
    <GoogleFormQuizCard
      quizContent={quizContent}
      sourceDocTitle={sourceDocTitle}
    />
  );
};

export default QuizDownloadCard;
