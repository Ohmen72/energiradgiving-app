import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { jsPDF } from "jspdf";
import kommuneData from "@/data/kommunestotte.json";

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
    <div className="max-w-xl mx-auto space-y-4 p-4">
      <h1 className="text-xl font-bold">Energirådgiving</h1>

      <Select onValueChange={val => handleChange("boligtype", val)}>
        <SelectTrigger>Boligtype</SelectTrigger>
        <SelectContent>
          <SelectItem value="enebolig">Enebolig</SelectItem>
          <SelectItem value="rekkehus">Rekkehus</SelectItem>
          <SelectItem value="leilighet">Leilighet</SelectItem>
        </SelectContent>
      </Select>

      <Input placeholder="Areal (m²)" type="number" onChange={e => handleChange("areal", e.target.value)} />
      <Input placeholder="Byggeår" type="number" onChange={e => handleChange("byggeaar", e.target.value)} />
      <Input placeholder="Antall personer i husstanden" type="number" onChange={e => handleChange("personer", e.target.value)} />

      <Select onValueChange={val => handleChange("kommune", val)}>
        <SelectTrigger>Kommune</SelectTrigger>
        <SelectContent>
          {kommuner.map(k => (
            <SelectItem key={k} value={k}>{k}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={val => handleChange("oppgraderinger", val)}>
        <SelectTrigger>Har boligen blitt oppgradert?</SelectTrigger>
        <SelectContent>
          <SelectItem value="ja">Ja</SelectItem>
          <SelectItem value="nei">Nei</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={val => handleChange("elektriskNiva", val)}>
        <SelectTrigger>Elektrisk forbruksnivå</SelectTrigger>
        <SelectContent>
          <SelectItem value="lav">Lavt</SelectItem>
          <SelectItem value="middels">Middels</SelectItem>
          <SelectItem value="hoy">Høyt</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={generateReport}>Generer rapport</Button>

      {rapport && (
        <Card>
          <CardContent className="space-y-2 mt-2">
            <h2 className="text-lg font-semibold">Rapport</h2>
            <p>Estimert årlig energiforbruk: {rapport.forbruk} kWh</p>
            <ul className="list-disc ml-4">
              {rapport.tiltak.map((t, i) => (
                <li key={i}>{t.navn}: Besparelse {t.besparelse} kWh/år, Enova støtte {t.enovaStotte} kr, Kommunal støtte {t.kommuneStotte} kr</li>
              ))}
            </ul>
            <p>Totalt investeringskostnad: {rapport.totalKostnad} kr</p>
            <p>Offentlig støtte: {rapport.totalStotte} kr</p>
            <p>Årlig besparelse: {rapport.totalBesparelse} kWh</p>
            <p>Tilbakebetalingstid: {rapport.tilbakebetaling} år</p>
            <Button onClick={exportToPDF}>Last ned rapport (PDF)</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}