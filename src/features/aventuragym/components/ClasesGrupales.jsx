import './ClasesGrupales.css';

export default function ClasesGrupales() {
  return (
    <div className="clases-table-container">
      <table className="clases-table">
        <thead>
          <tr>
            <th className="th-hora">Turno Mañana</th>
            <th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th><th>Sábado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="c-hora">7:00 a.m. - 7:50 a.m.</td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Jessica)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Jessica)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Jessica)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Jessica)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Jessica)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Jessica)</div></td>
          </tr>
          <tr>
            <td className="c-hora">8:00 a.m. - 8:50 a.m.</td>
            <td><div className="c-pill p-verde-claro">Fit Boxing<br/>(Marcia E.)</div></td>
            <td><div className="c-pill p-morado">Folklore<br/>(Jhonny)</div></td>
            <td><div className="c-pill p-verde-oscuro">X-BOX<br/>(Ross C.)</div></td>
            <td><div className="c-pill p-guinda">EX LOCAL<br/>(Alicia P.)</div></td>
            <td><div className="c-pill p-verde-claro">Fit Boxing<br/>(Marcia E.)</div></td>
            <td><div className="c-pill p-verde-oscuro">X-BOX<br/>(Ross C.)</div></td>
          </tr>
          <tr>
            <td className="c-hora">8:00 a.m. - 8:50 a.m.</td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
          </tr>
          <tr>
            <td className="c-hora">9:00 a.m. - 9:50 a.m.</td>
            <td><div className="c-pill p-celeste">Full Body<br/>(Milagros M.)</div></td>
            <td><div className="c-pill p-azul-marino">Localizado<br/>(Paty O.)</div></td>
            <td><div className="c-pill p-celeste">Full Body<br/>(Milagros M.)</div></td>
            <td><div className="c-pill p-rojo">Baile<br/>(Jean Franco)</div></td>
            <td><div className="c-pill p-azul-marino">Localizado<br/>(Paty O.)</div></td>
            <td><div className="c-pill p-rojo">Baile<br/>(David V.)</div></td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th className="th-hora" style={{marginTop: '20px'}}>Turno Tarde</th>
            <th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th><th>Sábado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="c-hora">6:00 p.m. - 6:50 p.m.</td>
            <td><div className="c-pill p-guinda">EX LOCAL<br/>(Xiomi G.)</div></td>
            <td><div className="c-pill p-rojo">Baile<br/>(David V.)</div></td>
            <td><div className="c-pill p-rojo">Baile<br/>(Elmer)</div></td>
            <td><div className="c-pill p-guinda">EX LOCAL<br/>(Susan T.)</div></td>
            <td><div className="c-pill p-morado">Folklore<br/>(Javier R.)</div></td>
            <td>-</td>
          </tr>
          <tr>
            <td className="c-hora">7:00 p.m. - 7:50 p.m.</td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(Bernal)</div></td>
            <td>-</td>
          </tr>
          <tr>
            <td className="c-hora">7:00 p.m. - 7:50 p.m.</td>
            <td><div className="c-pill p-rojo">Baile<br/>(David V.)</div></td>
            <td><div className="c-pill p-azul-marino">Localizado<br/>(Jessica)</div></td>
            <td><div className="c-pill p-celeste">Gimnasia<br/>(Susan T.)</div></td>
            <td><div className="c-pill p-rojo">Baile<br/>(Jean Franco)</div></td>
            <td><div className="c-pill p-guinda">EX LOCAL<br/>(Susan T.)</div></td>
            <td>-</td>
          </tr>
          <tr>
            <td className="c-hora">8:00 p.m. - 8:50 p.m.</td>
            <td><div className="c-pill p-azul-marino">Localizado<br/>(Carolina)</div></td>
            <td><div className="c-pill p-verde-claro">Fit Boxing<br/>(Marcia E.)</div></td>
            <td><div className="c-pill p-rojo">Baile<br/>(Gladys T.)</div></td>
            <td><div className="c-pill p-verde-claro">Fit Boxing<br/>(Luis A.)</div></td>
            <td><div className="c-pill p-rojo">Baile<br/>(Jeyson J.)</div></td>
            <td>-</td>
          </tr>
           <tr>
            <td className="c-hora">8:00 p.m. - 8:50 p.m.</td>
            <td><div className="c-pill p-naranja">Funcional<br/>(José)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(José)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(José)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(José)</div></td>
            <td><div className="c-pill p-naranja">Funcional<br/>(José)</div></td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}