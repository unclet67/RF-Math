# ShackMath — HAM Radio RF Engineering Workbench

A comprehensive React + TypeScript + Tailwind CSS RF calculation suite built for Amateur Radio (HAM) operators.

## Included RF Modules
1. **Antenna Design & Wavelength Suite**: Free-space wavelengths ($\lambda, \frac{1}{2}\lambda, \frac{1}{4}\lambda, \frac{5}{8}\lambda$), interactive SVG blueprints, and Imperial (`ft' in"`) + Metric (`m / cm`) cut-sheets for $\frac{1}{2}\lambda$ Dipole / Inverted-V, $\frac{1}{4}\lambda$ Ground Plane Vertical, EFHW (49:1 Unun), Full-Wave Delta & Quad Loops, 3-Element Yagi-Uda Beam, and VHF/UHF J-Pole.
2. **SWR, Return Loss, Reflection ($\Gamma$) & Complex Impedance**: Bi-directional solver from VSWR, Forward & Reflected Power (Watts), Return Loss (dB), or Complex Impedance ($R \pm jX$).
3. **Coax / Feedline Loss & Stubs**: Attenuation model ($k_1\sqrt{f} + k_2 f$) for 13 coaxial, hardline, and balanced transmission lines, including additional loss due to SWR, shack SWR masking, $\frac{1}{4}\lambda / \frac{1}{2}\lambda$ stubs, and a side-by-side comparison table.
4. **dBm / S-Meter, LC Resonance, Toroids & L-Network Matching**: Watts $\leftrightarrow$ dBm $\leftrightarrow$ Voltage $\leftrightarrow$ IARU S-Meter converter, LC tank & $Q$-factor solver, Amidon/Fair-Rite Toroid & Wheeler air-core coil calculator, and Low-Pass / High-Pass L-network impedance matcher.
5. **Link Budget, Fresnel Zone & Radio Horizon**: ERP/EIRP, Free Space Path Loss (FSPL), received signal power & S-Meter bargraph, 1st Fresnel Zone clearance, and $4/3$-Earth radio horizon.
6. **FCC OET Bulletin 65 RF Safety & MPE Calculator**: Controlled and Uncontrolled Maximum Permissible Exposure limits ($\text{mW/cm}^2$), emission mode duty-cycle presets, and minimum safe separation distances.

## Getting Started

```bash
npm install
npm run dev
```
