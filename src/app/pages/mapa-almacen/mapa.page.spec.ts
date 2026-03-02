import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapaAlmacenPage } from './mapa.page';

describe('MapaAlmacenPage', () => {
  let component: MapaAlmacenPage;
  let fixture: ComponentFixture<MapaAlmacenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MapaAlmacenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
