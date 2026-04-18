import { dashboardData } from "./DashBoardData.js";
import "./systeminfo.css";

export default function SystemInfo(){

const { cpu, memory, disk, uptime } =
dashboardData.systemInfo;

return(
<div className="card">
<h3>System Information</h3>

<p>CPU Usage</p>
<div className="progress">
<div style={{width: `${cpu}%`}}></div>
</div>

<p>Memory Usage</p>
<div className="progress yellow">
<div style={{width: `${memory}%`}}></div>
</div>

<p>Disk Usage</p>
<div className="progress">
<div style={{width: `${disk}%`}}></div>
</div>

<h4>System Uptime: {uptime}</h4>

</div>
)
}