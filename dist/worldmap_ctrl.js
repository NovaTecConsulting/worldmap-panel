'use strict';

System.register(['app/plugins/sdk', 'app/core/time_series2', 'app/core/utils/kbn', 'app/core/config', 'lodash', './map_renderer', './data_formatter', './css/worldmap-panel.css!'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, TimeSeries, kbn, config, _, mapRenderer, DataFormatter, _createClass, panelDefaults, mapCenters, WorldmapCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_appCoreConfig) {
      config = _appCoreConfig.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_map_renderer) {
      mapRenderer = _map_renderer.default;
    }, function (_data_formatter) {
      DataFormatter = _data_formatter.default;
    }, function (_cssWorldmapPanelCss) {}],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      panelDefaults = {
        maxDataPoints: 1,
        mapCenter: '(0°, 0°)',
        mapCenterLatitude: 0,
        mapCenterLongitude: 0,
        initialZoom: 1,
        valueName: 'total',
        circleMinSize: 2,
        circleMaxSize: 30,
        locationData: 'countries',
        thresholds: '0,10',
        colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
        unitSingle: '',
        unitPlural: '',
        showLegend: true,
        mouseWheelZoom: false,
        esMetric: 'Count',
        decimals: 0,
        hideEmpty: false,
        hideZero: false,
        stickyLabels: false,
        tableQueryOptions: {
          queryType: 'geohash',
          geohashField: 'geohash',
          latitudeField: 'latitude',
          longitudeField: 'longitude',
          metricField: 'metric'
        }

      };
      mapCenters = {
        '(0°, 0°)': { mapCenterLatitude: 0, mapCenterLongitude: 0 },
        'North America': { mapCenterLatitude: 40, mapCenterLongitude: -100 },
        'Europe': { mapCenterLatitude: 46, mapCenterLongitude: 14 },
        'West Asia': { mapCenterLatitude: 26, mapCenterLongitude: 53 },
        'SE Asia': { mapCenterLatitude: 10, mapCenterLongitude: 106 },
        'Last GeoHash': { mapCenterLatitude: 0, mapCenterLongitude: 0 }
      };

      WorldmapCtrl = function (_MetricsPanelCtrl) {
        _inherits(WorldmapCtrl, _MetricsPanelCtrl);

        function WorldmapCtrl($scope, $injector, contextSrv) {
          _classCallCheck(this, WorldmapCtrl);

          var _this = _possibleConstructorReturn(this, (WorldmapCtrl.__proto__ || Object.getPrototypeOf(WorldmapCtrl)).call(this, $scope, $injector));

          _this.setMapProvider(contextSrv);
          _.defaults(_this.panel, panelDefaults);

          _this.dataFormatter = new DataFormatter(_this, kbn);

          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));
          _this.events.on('data-snapshot-load', _this.onDataSnapshotLoad.bind(_this));

          _this.loadLocationDataFromFile();
          return _this;
        }

        _createClass(WorldmapCtrl, [{
          key: 'setMapProvider',
          value: function setMapProvider(contextSrv) {
            this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
            this.setMapSaturationClass();
          }
        }, {
          key: 'setMapSaturationClass',
          value: function setMapSaturationClass() {
            if (this.tileServer === 'CartoDB Dark') {
              this.saturationClass = 'map-darken';
            } else {
              this.saturationClass = '';
            }
          }
        }, {
          key: 'loadLocationDataFromFile',
          value: function loadLocationDataFromFile(reload) {
            var _this2 = this;

            if (this.map && !reload) return;

            if (this.panel.snapshotLocationData) {
              this.locations = this.panel.snapshotLocationData;
              return;
            }

            if (this.panel.locationData === 'jsonp endpoint') {
              if (!this.panel.jsonpUrl || !this.panel.jsonpCallback) return;

              window.$.ajax({
                type: 'GET',
                url: this.panel.jsonpUrl + '?callback=?',
                contentType: 'application/json',
                jsonpCallback: this.panel.jsonpCallback,
                dataType: 'jsonp',
                success: function success(res) {
                  _this2.locations = res;
                  _this2.render();
                }
              });
            } else if (this.panel.locationData === 'json endpoint') {
              if (!this.panel.jsonUrl) return;

              window.$.getJSON(this.panel.jsonUrl).then(function (res) {
                _this2.locations = res;
                _this2.render();
              });
            } else if (this.panel.locationData === 'table') {
              // .. Do nothing
            } else if (this.panel.locationData !== 'geohash' && this.panel.locationData !== 'json result') {
              window.$.getJSON('public/plugins/grafana-worldmap-panel/data/' + this.panel.locationData + '.json').then(this.reloadLocations.bind(this));
            }
          }
        }, {
          key: 'reloadLocations',
          value: function reloadLocations(res) {
            this.locations = res;
            this.refresh();
          }
        }, {
          key: 'showTableGeohashOptions',
          value: function showTableGeohashOptions() {
            return this.panel.locationData === 'table' && this.panel.tableQueryOptions.queryType === 'geohash';
          }
        }, {
          key: 'showTableCoordinateOptions',
          value: function showTableCoordinateOptions() {
            return this.panel.locationData === 'table' && this.panel.tableQueryOptions.queryType === 'coordinates';
          }
        }, {
          key: 'onPanelTeardown',
          value: function onPanelTeardown() {
            if (this.map) this.map.remove();
          }
        }, {
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Worldmap', 'public/plugins/grafana-worldmap-panel/partials/editor.html', 2);
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            if (!dataList) return;

            if (this.dashboard.snapshot && this.locations) {
              this.panel.snapshotLocationData = this.locations;
            }

            var data = [];

            if (this.panel.locationData === 'geohash') {
              this.dataFormatter.setGeohashValues(dataList, data);
            } else if (this.panel.locationData === 'table') {
              var tableData = dataList.map(DataFormatter.tableHandler.bind(this));
              this.dataFormatter.setTableValues(tableData, data);
            } else if (this.panel.locationData === 'json result') {
              this.series = dataList;
              this.dataFormatter.setJsonValues(data);
            } else {
              console.log('Processing AP data..');
              var regions = this.processApData(dataList);
              if (regions.length > 0) {
                this.series = regions.map(this.apSeriesHandler.bind(this));
                this.dataFormatter.setApValues(data);
              } else {
                this.series = dataList.map(this.seriesHandler.bind(this));
                this.dataFormatter.setValues(data);
              }
            }
            this.data = data;

            this.updateThresholdData();

            if (this.data.length && this.panel.mapCenter === 'Last GeoHash') {
              this.centerOnLastGeoHash();
            } else {
              this.render();
            }
          }
        }, {
          key: 'centerOnLastGeoHash',
          value: function centerOnLastGeoHash() {
            mapCenters[this.panel.mapCenter].mapCenterLatitude = _.last(this.data).locationLatitude;
            mapCenters[this.panel.mapCenter].mapCenterLongitude = _.last(this.data).locationLongitude;
            this.setNewMapCenter();
          }
        }, {
          key: 'onDataSnapshotLoad',
          value: function onDataSnapshotLoad(snapshotData) {
            this.onDataReceived(snapshotData);
          }
        }, {
          key: 'resolveDatasourceType',
          value: function resolveDatasourceType() {
            if (this.datasourceType !== undefined) {
              return this.datasourceType;
            } else {
              try {
                var ds = this.panel.datasource !== null ? this.panel.datasource : config.defaultDatasource;
                this.datasourceType = this.datasourceSrv.datasources[ds].meta.id;
                return this.datasourceType;
              } catch (err) {
                var e = new Error("Failed to resolve Datasource: " + err.message);
                e.origError = err;
                throw e;
              }
            }
          }
        }, {
          key: 'buildColumnMap',
          value: function buildColumnMap(columns) {
            var required_columns = ['Time', 'id', 'location', 'targetEnvironment', 'status'];
            var columnMap = {};
            for (var i = 0; i < columns.length; i++) {
              var cName = columns[i].text;
              var idx = required_columns.indexOf(cName);
              if (idx > -1) {
                columnMap[cName] = i;
                required_columns.splice(idx, 1);
              }
            }

            if (required_columns.length === 0) {
              return columnMap;
            }
            throw 'Invalid columns received. Required: <' + required_columns.toString() + '>';
          }
        }, {
          key: 'processAPInfluxTableData',
          value: function processAPInfluxTableData(dataList) {
            var _this3 = this;

            var regions = [];
            dataList.forEach(function (element) {

              var columnMap = _this3.buildColumnMap(element.columns);
              // ensure we are not dealing with something not AP related
              if (!columnMap) {
                return; // this is continue actually
              }

              element.rows.forEach(function (row) {

                var id = row[columnMap['id']];
                var location = row[columnMap['location']];
                var targetEnvironment = row[columnMap['targetEnvironment']];
                var isKO = row[columnMap['status']] === 0;

                if (id === '' || location === '' || targetEnvironment === '') {
                  var timeStamp = row[columnMap['Time']];
                  console.log('Skipping row at <' + new Date(timeStamp).toISOString() + '>! id, location or targetEnvironment are mandatory.');
                  return;
                }

                var region = regions.find(function (r) {
                  return location === r.name;
                });
                if (region === undefined) {
                  region = {
                    name: location,
                    ids: [],
                    failedIds: [],
                    environments: {}
                  };
                  regions.push(region);
                }

                var idExists = region.ids.includes(id);
                if (!idExists) {
                  region.ids.push(id);
                }
                if (isKO) {
                  if (!region.failedIds.includes(id)) {
                    region.failedIds.push(id);
                  }
                }

                if (targetEnvironment !== undefined) {
                  if (region.environments[targetEnvironment]) {
                    region.environments[targetEnvironment] = region.environments[targetEnvironment] + 1;
                  } else {
                    region.environments[targetEnvironment] = 1;
                  }
                }
              });
            });
            return regions;
          }
        }, {
          key: 'processAPESData',
          value: function processAPESData(dataList) {
            var regions = [];

            dataList.forEach(function (element) {
              // ensure we are not dealing with something not AP related
              if (!element.target || !element.props["location.keyword"] || !element.props["id.keyword"]) {
                return; // this is continue actually
              }

              var location = element.props["location.keyword"];
              var targetEnvironment = element.props["targetEnvironment.keyword"];
              var id = element.props["id.keyword"];
              var isKO = element.target.endsWith("KO");

              // find region
              var region = regions.find(function (r) {
                return location == r.name;
              });
              if (region === undefined) {
                region = {
                  name: location,
                  ids: [],
                  failedIds: [],
                  environments: {}
                };
                regions.push(region);
              }

              // resolve if ID has been processed
              var idExists = region.ids.includes(id);
              if (!idExists) {
                region.ids.push(id);
              }

              if (!isKO) {
                if (targetEnvironment !== undefined) {
                  if (region.environments[targetEnvironment]) {
                    region.environments[targetEnvironment] = region.environments[targetEnvironment] + 1;
                  } else {
                    region.environments[targetEnvironment] = 1;
                  }
                }
              }

              // in case of KO need to understand if it fails
              if (isKO) {
                // first find the OK equivalent
                var allTarget = element.target.replace('__KO', '__ALL');
                var allElement = dataList.find(function (d) {
                  return d.target == allTarget;
                });
                // if we can not find than it's serious error
                if (allElement === undefined) {
                  console.error('Unable to locate the ' + allTarget + ' data series.');
                } else {
                  for (var index = 0; index < element.datapoints.length; index++) {
                    var failingInstances = element.datapoints[index][0];
                    var allInstances = allElement.datapoints[index][0];
                    if (failingInstances === allInstances) {
                      region.failedIds.push(id);
                      break;
                    }
                  }
                }
              }
            });

            return regions;
          }
        }, {
          key: 'processApData',
          value: function processApData(dataList) {
            var dsType = this.resolveDatasourceType();
            switch (dsType) {
              case 'influxdb':
                return this.processAPInfluxTableData(dataList);
              case 'elasticsearch':
                return this.processAPESData(dataList);
              default:
                throw 'Unsupported datasource <' + dsType + '>';
            }
          }
        }, {
          key: 'apSeriesHandler',
          value: function apSeriesHandler(region) {
            var total = region.ids.length;
            var failing = region.failedIds.length;
            var successRate = ((total - failing) / total * 100).toFixed(0);

            var series = new TimeSeries({
              datapoints: [],
              alias: region.name
            });

            series.stats = {
              successRate: successRate,
              totalProbes: total,
              failingProbes: failing,
              failingProbesNames: region.failedIds,
              targetEnvironments: region.environments
            };

            return series;
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData) {
            var series = new TimeSeries({
              datapoints: seriesData.datapoints,
              alias: seriesData.target
            });

            series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
            return series;
          }
        }, {
          key: 'setNewMapCenter',
          value: function setNewMapCenter() {
            if (this.panel.mapCenter !== 'custom') {
              this.panel.mapCenterLatitude = mapCenters[this.panel.mapCenter].mapCenterLatitude;
              this.panel.mapCenterLongitude = mapCenters[this.panel.mapCenter].mapCenterLongitude;
            }
            this.mapCenterMoved = true;
            this.render();
          }
        }, {
          key: 'setZoom',
          value: function setZoom() {
            this.map.setZoom(this.panel.initialZoom || 1);
          }
        }, {
          key: 'toggleLegend',
          value: function toggleLegend() {
            if (!this.panel.showLegend) {
              this.map.removeLegend();
            }
            this.render();
          }
        }, {
          key: 'toggleMouseWheelZoom',
          value: function toggleMouseWheelZoom() {
            this.map.setMouseWheelZoom();
            this.render();
          }
        }, {
          key: 'toggleStickyLabels',
          value: function toggleStickyLabels() {
            this.map.clearCircles();
            this.render();
          }
        }, {
          key: 'changeThresholds',
          value: function changeThresholds() {
            this.updateThresholdData();
            this.map.legend.update();
            this.render();
          }
        }, {
          key: 'updateThresholdData',
          value: function updateThresholdData() {
            this.data.thresholds = this.panel.thresholds.split(',').map(function (strValue) {
              return Number(strValue.trim());
            });
            while (_.size(this.panel.colors) > _.size(this.data.thresholds) + 1) {
              // too many colors. remove the last one.
              this.panel.colors.pop();
            }
            while (_.size(this.panel.colors) < _.size(this.data.thresholds) + 1) {
              // not enough colors. add one.
              var newColor = 'rgba(50, 172, 45, 0.97)';
              this.panel.colors.push(newColor);
            }
          }
        }, {
          key: 'changeLocationData',
          value: function changeLocationData() {
            this.loadLocationDataFromFile(true);

            if (this.panel.locationData === 'geohash') {
              this.render();
            }
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            mapRenderer(scope, elem, attrs, ctrl);
          }
        }]);

        return WorldmapCtrl;
      }(MetricsPanelCtrl);

      _export('default', WorldmapCtrl);

      WorldmapCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=worldmap_ctrl.js.map
