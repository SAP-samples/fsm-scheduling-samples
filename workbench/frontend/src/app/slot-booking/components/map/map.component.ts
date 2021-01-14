import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import * as olProj from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import Geometry from 'ol/geom/Geometry';
import Point from 'ol/geom/Point';
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
} from 'ol/style';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  constructor() { }

  @Input() drawToMap$: Observable<{ latitude: number; longitude: number; }>
  @Output() select = new EventEmitter<{ latitude: number; longitude: number; }>();

  map: Map;
  layer: VectorLayer;
  onDistroy$ = new Subject();

  public ngOnDestroy() {
    this.onDistroy$.next();
  }

  public ngOnInit() {

    this.map = new Map({
      target: 'view_map',
      layers: [
        new TileLayer({ source: new OSM() })
      ],
      view: new View({
        center: olProj.fromLonLat([13.3175292, 52.5158595]),
        zoom: 5
      })
    });

    this.layer = new VectorLayer({ source: new VectorSource({ features: [] }) });
    this.map.addLayer(this.layer);

    this.map.on('click', (evt) => {
      const [longitude, latitude] = olProj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326') as [number, number]
      this.select.next({ latitude, longitude });
    });

    if (this.drawToMap$) {
      this.drawToMap$.pipe(
        tap((location) => {
          this.draw(location);
        }),
        takeUntil(this.onDistroy$)
      ).subscribe();
    }

  }

  draw({ latitude, longitude }: { latitude: number; longitude: number; }) {
    this.layer.getSource().clear();

    if (!latitude || !longitude) return

    const point = new Feature<Geometry>({
      type: 'geoMarker',
      geometry: new Point(olProj.fromLonLat([longitude, latitude])),
    });

    point.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({ color: 'white', width: 5, }),
        }),
      })
    );


    this.layer.getSource().addFeature(point);

    const g = point.getGeometry();
    const view = this.map.getView();
    view.fit(g as SimpleGeometry, { maxZoom: view.getZoom() });
    this.map.render();

  }
}
