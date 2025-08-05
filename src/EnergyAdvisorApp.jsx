
import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import kommuneData from "./data/kommunestotte.json";

export default function EnergyAdvisorApp() {
  const [kommuner, setKommuner] = useState([]);
  const [formData, setFormData] = useState({
    boligtype: "",
    areal: "",
    byggeaar: "",
    oppgraderinger: "nei",
    tiltak: [],
    personer: "",
    elektriskNiva: "",
    kommune: ""
  });

  const [rapport, setRapport] = useState(null);

  useEffect(() => {
    setKommuner(Object.keys(kommuneData));
  }, []);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = () => {
    const { boligtype, areal, byggeaar, oppgraderinger, personer, elektriskNiva, kommune } = formData;
    const arealInt = parseInt(areal);
    const personInt = parseInt(personer);

    let forbruk = arealInt * 160 + personInt * 500;
    if (elektriskNiva === "hoy") forbruk += 2000;
    if (elektriskNiva === "lav") forbruk -= 1000;

    const lokalStotte = kommuneData[kommune] || {};

    const tiltak = [
      {
        navn: "Etterisolere loft",
        kostnad: 30000,
        besparelse: 2200,
        enovaStotte: 8000,
        kommuneStotte: lokalStotte.loft || 0
      },
      {
        navn: "Installere varmepumpe",
        kostnad: 35000,
        besparelse: 4300,
        enovaStotte: 5000,
        kommuneStotte: lokalStotte.varmepumpe || 0
      }
    ];

    const totalBesparelse = tiltak.reduce((sum, t) => sum + t.besparelse, 0);
    const totalStotte = tiltak.reduce((sum, t) => sum + t.enovaStotte + t.kommuneStotte, 0);
    const totalKostnad = tiltak.reduce((sum, t) => sum + t.kostnad, 0);
    const tilbakebetaling = ((totalKostnad - totalStotte) / (totalBesparelse * 0.25)).toFixed(1);

    const rapport = {
      forbruk,
      tiltak,
      totalBesparelse,
      totalStotte,
      totalKostnad,
      tilbakebetaling
    };

    setRapport(rapport);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Energirådgivingsrapport", 20, 20);

    doc.setFontSize(12);
    doc.text(`Estimert årlig energiforbruk: ${rapport.forbruk} kWh`, 20, 40);
    rapport.tiltak.forEach((t, i) => {
      doc.text(`Tiltak ${i + 1}: ${t.navn}`, 20, 50 + i * 20);
      doc.text(`Besparelse: ${t.besparelse} kWh/år, Enova støtte: ${t.enovaStotte} kr, Kommunal støtte: ${t.kommuneStotte} kr`, 30, 58 + i * 20);
    });

    doc.text(`\nTotalt investeringskostnad: ${rapport.totalKostnad} kr`, 20, 110);
    doc.text(`Offentlig støtte totalt: ${rapport.totalStotte} kr`, 20, 120);
    doc.text(`Årlig besparelse: ${rapport.totalBesparelse} kWh`, 20, 130);
    doc.text(`Tilbakebetalingstid: ${rapport.tilbakebetaling} år`, 20, 140);

    doc.save("energirapport.pdf");
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Energirådgiving</h1>
      <label>Boligtype:</label>
      <select onChange={e => handleChange("boligtype", e.target.value)}>
        <option value="">Velg</option>
        <option value="enebolig">Enebolig</option>
        <option value="rekkehus">Rekkehus</option>
        <option value="leilighet">Leilighet</option>
      </select>
      <br />
      <input placeholder="Areal (m²)" type="number" onChange={e => handleChange("areal", e.target.value)} /><br />
      <input placeholder="Byggeår" type="number" onChange={e => handleChange("byggeaar", e.target.value)} /><br />
      <input placeholder="Antall personer i husstanden" type="number" onChange={e => handleChange("personer", e.target.value)} /><br />
      <label>Kommune:</label>
      <select onChange={e => handleChange("kommune", e.target.value)}>
        <option value="">Velg kommune</option>
        {kommuner.map(k => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <br />
      <label>Har boligen blitt oppgradert?</label>
      <select onChange={e => handleChange("oppgraderinger", e.target.value)}>
        <option value="nei">Nei</option>
        <option value="ja">Ja</option>
      </select>
      <br />
      <label>Elektrisk forbruksnivå:</label>
      <select onChange={e => handleChange("elektriskNiva", e.target.value)}>
        <option value="">Velg nivå</option>
        <option value="lav">Lavt</option>
        <option value="middels">Middels</option>
        <option value="hoy">Høyt</option>
      </select>
      <br /><br />
      <button onClick={generateReport}>Generer rapport</button>
      {rapport && (
        <div style={{ marginTop: "1rem", border: "1px solid #ccc", padding: "1rem" }}>
          <h2>Rapport</h2>
          <p>Estimert årlig energiforbruk: {rapport.forbruk} kWh</p>
          <ul>
            {rapport.tiltak.map((t, i) => (
              <li key={i}>{t.navn}: Besparelse {t.besparelse} kWh/år, Enova støtte {t.enovaStotte} kr, Kommunal støtte {t.kommuneStotte} kr</li>
            ))}
          </ul>
          <p>Totalt investeringskostnad: {rapport.totalKostnad} kr</p>
          <p>Offentlig støtte: {rapport.totalStotte} kr</p>
          <p>Årlig besparelse: {rapport.totalBesparelse} kWh</p>
          <p>Tilbakebetalingstid: {rapport.tilbakebetaling} år</p>
          <button onClick={exportToPDF}>Last ned rapport (PDF)</button>
        </div>
      )}
    </div>
  );
}
