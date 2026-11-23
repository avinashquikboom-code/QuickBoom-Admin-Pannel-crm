import * as React from 'react';

export interface TruncatedTextProps {
  value?: string | number | null;
  text?: string | number | null;
  children?: React.ReactNode;
  className?: string;
  maxWidth?: string;
  label?: string;
}

export declare function TruncatedText(props: TruncatedTextProps): React.JSX.Element | null;
export default TruncatedText;
export declare function truncateWords(str: string, maxWords?: number): string;
