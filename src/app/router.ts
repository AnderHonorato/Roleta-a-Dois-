import { useCallback, useEffect, useState } from 'react';

/**
 * Roteador por hash, minimo de proposito.
 *
 * O produto tem poucas telas e nenhuma delas precisa de URL
 * compartilhavel - e conteudo privado. Hash evita configuracao de
 * servidor e mantem o bundle sem uma dependencia de roteamento.
 */
export type Route =
  | 'game'
  | 'couple'
  | 'profile'
  | 'achievements'
  | 'history'
  | 'settings'
  | 'auth'
  | 'privacy';

const ROUTES: Route[] = [
  'game',
  'couple',
  'profile',
  'achievements',
  'history',
  'settings',
  'auth',
  'privacy',
];

function parse(hash: string): Route {
  const value = hash.replace(/^#\/?/, '').split('?')[0];
  return (ROUTES as string[]).includes(value) ? (value as Route) : 'game';
}

export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? 'game' : parse(window.location.hash),
  );

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = `#/${next}`;
    // O hashchange cobre o caso normal; este set garante resposta
    // imediata quando a rota destino e a mesma ja aberta.
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return [route, navigate];
}

export { ROUTES };
