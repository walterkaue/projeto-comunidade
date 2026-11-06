// Os aparelhos da simulação (nomes usados no relatório). Tudo é emulação: ver "O que a emulação não mostra"
// no relatório. CPU e rede lentas só existem no Chromium (pelo CDP).

import { devices, type PlaywrightTestOptions, type PlaywrightWorkerOptions } from '@playwright/test';

export const PORTA = 4181;

export type ModoCompartilhar = 'sim' | 'ausente' | 'cancela' | 'sem-arquivo';

export interface Opcoes {
  /** CPU N vezes mais lenta (Chromium). */
  cpu: number;
  /** Rede emulada (Chromium): '3g-lento' (400 kbit/s, 2 s ida e volta) ou '4g'. */
  rede: '' | '3g-lento' | '4g';
  /** Como o "menu de compartilhar" se comporta. */
  compartilhar: ModoCompartilhar;
  /** Download que não acontece (navegador dentro de app). */
  semDownload: boolean;
  /** Texto do site a 200% (letra grande do aparelho). */
  letra200: boolean;
}

export type Uso = Partial<PlaywrightTestOptions & PlaywrightWorkerOptions> & Partial<Opcoes>;

const UA_ANDROID =
  'Mozilla/5.0 (Linux; Android 13; SM-A135M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const UA_SAMSUNG =
  'Mozilla/5.0 (Linux; Android 13; SM-A135M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36';
const UA_WEBVIEW =
  'Mozilla/5.0 (Linux; Android 13; SM-A135M Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0 Android WhatsApp/2.24';

const celular = (largura: number, altura: number, dpr = 2, ua = UA_ANDROID): Uso => ({
  browserName: 'chromium',
  viewport: { width: largura, height: altura },
  screen: { width: largura, height: altura },
  deviceScaleFactor: dpr,
  isMobile: true,
  hasTouch: true,
  userAgent: ua,
});

export const APARELHOS: Record<string, { use: Uso; descricao: string }> = {
  'AND-FRACO': {
    descricao: 'Chromium, 360×640, toque, DPR 2, CPU 6× mais lenta, 3G lento (400 kbit/s, 2 s ida e volta)',
    use: { ...celular(360, 640), cpu: 6, rede: '3g-lento', compartilhar: 'sim' },
  },
  'AND-PEQUENO': {
    descricao: 'Chromium, 320×568, toque, CPU 4× mais lenta',
    use: { ...celular(320, 568), cpu: 4, compartilhar: 'sim' },
  },
  'AND-GRANDE': {
    descricao: 'Chromium, 412×915, toque, 4G',
    use: { ...celular(412, 915, 2.625), rede: '4g', compartilhar: 'sim' },
  },
  'AND-DEITADO': {
    descricao: 'Chromium, 640×360 (e 360×330 imitando o teclado aberto, aproximação)',
    use: { ...celular(640, 360), compartilhar: 'sim' },
  },
  SAMSUNG: {
    descricao: 'Chromium com user agent do Samsung Internet, modo escuro (aproximação)',
    use: { ...celular(360, 740, 3, UA_SAMSUNG), colorScheme: 'dark', compartilhar: 'sim' },
  },
  WEBVIEW: {
    descricao: 'Chromium com user agent de navegador dentro de app, sem navigator.share e sem download (aproximação)',
    use: { ...celular(360, 640, 2, UA_WEBVIEW), compartilhar: 'ausente', semDownload: true },
  },
  'IPHONE-SE': {
    descricao: 'WebKit, 375×667, toque',
    use: { ...devices['iPhone SE'], browserName: 'webkit', compartilhar: 'sim' },
  },
  'IPHONE-GRANDE': {
    descricao: 'WebKit, 430×932, toque',
    use: { ...devices['iPhone 14 Pro Max'], browserName: 'webkit', viewport: { width: 430, height: 932 }, compartilhar: 'sim' },
  },
  TABLET: {
    descricao: 'Chromium, 800×1280, toque',
    use: { ...celular(800, 1280, 2), compartilhar: 'sim' },
  },
  'PC-FIREFOX': {
    descricao: 'Firefox, 1366×768, mouse e teclado, sem navigator.share',
    use: { browserName: 'firefox', viewport: { width: 1366, height: 768 }, compartilhar: 'ausente' },
  },
  'PC-GRANDE': {
    descricao: 'Chromium, 1920×1080, sem toque, sem menu de compartilhar',
    use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 }, compartilhar: 'ausente' },
  },
};
