import { Outlet } from 'react-router-dom'
import TopbarMarkets from '@/components/TopbarMarkets'

const MarketsLayout = () => (
  <>
    <TopbarMarkets />
    <div className="pt-20">
      <Outlet />
    </div>
  </>
)

export default MarketsLayout
