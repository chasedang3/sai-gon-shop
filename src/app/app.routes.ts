import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductListComponent } from './pages/products/product-list.component';
import { ProductDetailComponent } from './pages/products/product-detail.component';
import { AboutUsComponent } from './pages/about/about-us.component';
import { CanvasHangingGuideComponent } from './pages/blog/canvas-hanging-guide.component';
import { AdminLoginComponent } from './pages/admin/admin-login/admin-login.component';
import { AdminProductCreateComponent } from './pages/admin/admin-product-create/admin-product-create.component';
import { AdminProductListComponent } from './pages/admin/admin-product-list/admin-product-list.component';
import { AdminProductEditComponent } from './pages/admin/admin-product-edit/admin-product-edit.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'admin/login', component: AdminLoginComponent },
    { path: 'admin/products', component: AdminProductListComponent },
    { path: 'admin/products/create', component: AdminProductCreateComponent },
    { path: 'admin/products/edit/:id', component: AdminProductEditComponent },
    { path: 'about', component: AboutUsComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'products/:id', component: ProductDetailComponent },
    { path: 'blog/huong-dan-treo-tranh-canvas', component: CanvasHangingGuideComponent }
];