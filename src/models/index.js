import { BraunRadio } from './BraunRT20.js';
import { LexonTykho } from './LexonTykho.js';
import { TivoliModelOne } from './TivoliModelOne.js';

export { BaseRadio } from './BaseRadio.js';
export { BraunRadio } from './BraunRT20.js';
export { LexonTykho } from './LexonTykho.js';
export { TivoliModelOne } from './TivoliModelOne.js';

export const RADIO_MODELS = {
  braun: {
    id: 'braun',
    name: 'BRAUN',
    year: '1961',
    designer: 'Dieter Rams',
    title: 'Braun RT 20 (1961)',
    subtitle: 'RT 20 • 1961 HI-FI RECEIVER',
    class: BraunRadio
  },
  lexon: {
    id: 'lexon',
    name: 'LEXON',
    year: '1997',
    designer: 'Marc Berthier',
    title: 'Lexon Tykho (1997)',
    subtitle: 'TYKHO • 1997 MARC BERTHIER',
    class: LexonTykho
  },
  tivoli: {
    id: 'tivoli',
    name: 'TIVOLI AUDIO',
    year: '2000',
    designer: 'Henry Kloss',
    title: 'Tivoli Model One (2000)',
    subtitle: 'MODEL ONE • 2000 HENRY KLOSS',
    class: TivoliModelOne
  }
};
