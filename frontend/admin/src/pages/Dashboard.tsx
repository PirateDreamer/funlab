import './Dashboard.css'

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1>工作台</h1>
      <div className="dashboard-cards">
        <div className="dash-card">
          <strong>0</strong>
          <span>已发布页面</span>
        </div>
        <div className="dash-card">
          <strong>0</strong>
          <span>草稿</span>
        </div>
        <div className="dash-card">
          <strong>0</strong>
          <span>模板数量</span>
        </div>
      </div>
      <div className="dashboard-empty">
        <p>暂无最近活动页面，点击左侧「页面搭建」开始创建。</p>
      </div>
    </div>
  )
}
