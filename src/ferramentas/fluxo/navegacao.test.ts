import { beforeEach, describe, expect, it, vi } from 'vitest';
import { irAoInicio, irAoPasso, mudarAlgo, passosEmpurrados, registrarHash, reiniciarNavegacao, voltarDoPasso, type Ambiente } from './navegacao';

function falso() {
  const amb = {
    location: { hash: '#/fazer/evento', replace: vi.fn() },
    history: { back: vi.fn() },
  };
  return { amb: amb as unknown as Ambiente, loc: amb.location, hist: amb.history };
}

beforeEach(() => reiniciarNavegacao());

describe('Voltar do passo 2 e do 3', () => {
  it('volta no histórico só enquanto o Continuar empurrou passos', () => {
    const { amb, loc, hist } = falso();
    irAoPasso('evento', 2, amb);
    irAoPasso('evento', 3, amb);
    expect(loc.hash).toBe('#/fazer/evento/3');
    expect(passosEmpurrados()).toBe(2);

    voltarDoPasso('evento', 3, amb);
    voltarDoPasso('evento', 2, amb);
    expect(hist.back).toHaveBeenCalledTimes(2);
    expect(passosEmpurrados()).toBe(0);

    // Sem passos empurrados (abriu o /3 direto): troca o endereço, não sai do site.
    voltarDoPasso('evento', 3, amb);
    expect(hist.back).toHaveBeenCalledTimes(2);
    expect(loc.replace).toHaveBeenCalledWith('#/fazer/evento/2');
  });

  it('Mudar algo e Fazer outro zeram a contagem', () => {
    const { amb, loc } = falso();
    irAoPasso('evento', 2, amb);
    irAoPasso('evento', 3, amb);
    irAoPasso('evento', 'pronto', amb);
    mudarAlgo('evento', amb);
    expect(loc.hash).toBe('#/fazer/evento');
    expect(passosEmpurrados()).toBe(0);
    irAoPasso('evento', 2, amb);
    irAoInicio(amb);
    expect(loc.hash).toBe('#/');
    expect(passosEmpurrados()).toBe(0);
  });
});

describe('Voltar do passo 1', () => {
  it('veio do início: volta no histórico', () => {
    const { amb, loc, hist } = falso();
    registrarHash('#/');
    registrarHash('#/fazer/evento');
    voltarDoPasso('evento', 1, amb);
    expect(hist.back).toHaveBeenCalledTimes(1);
    expect(loc.replace).not.toHaveBeenCalled();
  });

  it('não sabe de onde veio ou veio de outro lugar: troca por "#/", nunca sai do site', () => {
    const a = falso();
    voltarDoPasso('evento', 1, a.amb);
    expect(a.hist.back).not.toHaveBeenCalled();
    expect(a.loc.replace).toHaveBeenCalledWith('#/');

    registrarHash('#/fazer/evento/pronto');
    registrarHash('#/fazer/evento');
    const b = falso();
    voltarDoPasso('evento', 1, b.amb);
    expect(b.hist.back).not.toHaveBeenCalled();
    expect(b.loc.replace).toHaveBeenCalledWith('#/');
  });

  it('zera os passos empurrados', () => {
    const { amb } = falso();
    irAoPasso('evento', 2, amb);
    voltarDoPasso('evento', 1, amb);
    expect(passosEmpurrados()).toBe(0);
  });
});
