export interface Example {
  jp: string;
  cn: string;
}

export interface RelatedWord {
  type: string;
  jp: string;
  cn: string;
}

export interface TangoWord {
  id: string;
  expression: string;
  pitchAccent: string;
  partOfSpeech: string;
  reading: string;
  definition: string;
  examples: Example[];
  related: RelatedWord[];
}
