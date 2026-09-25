import { createElement } from 'react';
import {
  BriefcaseBusiness,
  CakeSlice,
  Gem,
  PartyPopper,
  Tag,
} from 'lucide-react';

export const EVENT_TYPE_ICONS = Object.freeze({
  corporativo: BriefcaseBusiness,
  boda: Gem,
  cumpleaños: CakeSlice,
  social: PartyPopper,
  otros: Tag,
});

const normalizeTypeKey = (value) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const getEventTypeIcon = (value, props = {}) => {
  const Icon =
    EVENT_TYPE_ICONS[normalizeTypeKey(value)] || EVENT_TYPE_ICONS.otros;

  return createElement(Icon, {
    'aria-hidden': 'true',
    ...props,
  });
};
