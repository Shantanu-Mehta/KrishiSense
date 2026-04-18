import { dashboardData } from "./DashBoardData.js";
import "./protocoldistribution.css";

export default function ProtocolDistribution(){

const { mqtt, http, coap } =
dashboardData.protocols;

return(
<div className="card">
<h3>Protocol Distribution</h3>

<p>MQTT : {mqtt}%</p>
<p>HTTP : {http}%</p>
<p>CoAP : {coap}%</p>

</div>
)
}