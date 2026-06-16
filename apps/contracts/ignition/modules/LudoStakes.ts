import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// cUSD token addresses per network
const CUSD: Record<string, string> = {
  celo: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  'celo-sepolia': '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Alfajores
  hardhat: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // placeholder for local fork
};

/**
 * Deploy LudoStakes.
 *
 * Required parameters (pass via --parameters flag or ignition/parameters.json):
 *   gameServer  — address authorised to call declareWinner / cancelGame
 *   treasury    — address receiving the 8% protocol fee
 *   network     — "celo" | "celo-sepolia" | "hardhat"  (selects cUSD address)
 *
 * Example (Alfajores):
 *   pnpm deploy:celo-sepolia \
 *     --parameters '{"gameServer":"0x...","treasury":"0x...","network":"celo-sepolia"}'
 */
const LudoStakesModule = buildModule('LudoStakesModule', (m) => {
  const gameServer = m.getParameter<string>('gameServer');
  const treasury = m.getParameter<string>('treasury');
  const network = m.getParameter<string>('network', 'celo-sepolia');

  const cUSDAddress = CUSD[network] ?? CUSD['celo-sepolia'];

  const ludoStakes = m.contract('LudoStakes', [gameServer, treasury, cUSDAddress]);

  return { ludoStakes };
});

export default LudoStakesModule;
