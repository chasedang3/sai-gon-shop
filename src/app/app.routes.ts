import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductListComponent } from './pages/products/product-list.component';
import { ProductDetailComponent } from './pages/products/product-detail.component';
import { AboutUsComponent } from './pages/about/about-us.component';
import { CanvasHangingGuideComponent } from './pages/blog/canvas-hanging-guide.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'about', component: AboutUsComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'products/:id', component: ProductDetailComponent },
    { path: 'blog/huong-dan-treo-tranh-canvas', component: CanvasHangingGuideComponent }
];