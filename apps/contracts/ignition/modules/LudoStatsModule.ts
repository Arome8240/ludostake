import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const LudoStatsModule = buildModule('LudoStatsModule', (m) => {
  const stats = m.contract('LudoStats');
  return { stats };
});

export default LudoStatsModule;
