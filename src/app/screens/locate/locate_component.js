import React from 'react';
import { Link } from 'react-router';
import LocationSearchContainer from '../../components/LocationSearch/LocationSearchContainer';
import PubNameSearchContainer from '../../components/PubNameSearch/PubNameSearchContainer';
import PubDetail from '../../components/PubDetail/PubDetail';
import { normaliseLatLng } from '../../utils/pintsUtils';
import config from '../../config';
import ReactMapboxGl, {
    Layer,
    Feature,
    ZoomControl,
    Marker,
    Circle
} from 'react-mapbox-gl';
import GA from 'react-ga';

const MapBox = ReactMapboxGl({
  accessToken: config.MAPBOX_API_KEY
});

const MARKER_IMG = {
    url: "/img/pint.png"
};

const MARKER_IMG_UNKNOWN = {
    url: "/img/unknown-marker.png"
};

class Locate extends React.Component {

    constructor(props) {
        super(props);

        this.onMarkerClick = this.onMarkerClick.bind(this);
        this.onZoomChanged = this.onZoomChanged.bind(this);
        this.onMapDragEnd = this.onMapDragEnd.bind(this);
    }

    componentWillMount() {
        if(this.props.params.suggest) {
            this.props.shouldSuggest(true);
            this.props.fetchPosition();
        }

        if(this.props.params.foursquareID) {
            this.previousFoursquareID = this.props.params.foursquareID;
            this.props.setCurrentPub(this.props.params.foursquareID);
            this.props.fetchPubDetail(this.props.params.foursquareID);
        }
    }

    componentWillReceiveProps(nextProps) {
        if(this.previousFoursquareID !== nextProps.params.foursquareID) {
            this.previousFoursquareID = nextProps.params.foursquareID;
            this.props.setCurrentPub(nextProps.params.foursquareID);
        }
    }

    onMapDragEnd(ev) {
        this.props.onCenterChanged(ev.getCenter());
    }

    onZoomChanged(ev) {
        this.props.onZoomChanged(ev.getZoom());
    }

    onMarkerClick(foursquareID) {
        this.props.history.push(`/pub/${foursquareID}`);
    }

    getMarkers(locations, type) {

        if(!locations) {
            return;
        }

        let markers = [];
        for(var prop in locations) {
            const pub = locations[prop];
            if(type === 'known' && pub.known || !type) {
                markers.push(
                    <Feature
                        coordinates={pub.location.coordinates}
                        anchor="center"
                        onClick={() => {this.onMarkerClick(pub.foursquareID)}}
                    />
                )
            }
        }

        return (<Layer
                id={`pub-circle-${type}`}
                type="circle"
                paint={this.getPointPaint(type)}
            >
                {markers}
            </Layer>);

    }

    getCirclePaint() {
        return {
            'circle-radius': {
                'base': 1.75,
                'stops': [[15, 28], [19, 490]]
            },
            'circle-color': '#FFFFFF',
            'circle-opacity': 0.1,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#000000'
        }
    }

    getPointPaint(type) {
        if(type === 'known') {
            return {
                'circle-radius': 13,
                'circle-color': '#f28925',
                'circle-opacity': 1,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000000'
            }
        }
        return {
            'circle-radius': 10,
            'circle-color': '#f3bc26',
            'circle-opacity': 1,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#000000'
        }
    }

    getFocusCircle() {
        if(this.props.pub) {
            const location = this.props.pub.location;
            return (
                <Layer
                  id="focus-circle"
                  type="circle"
                  paint={this.getCirclePaint()}
                >
                    <Feature coordinates={this.props.pub.location.coordinates} />
                </Layer>
            )
        }
        return null;
    }

    render() {
        let { lat, lng } = this.props.centre;
        return (
            <div className="Screen Locate">
                <header className="Screen-header">
                    <LocationSearchContainer
                        getMapBounds={() => {return this.map.props.map.getBounds()}}
                        onCenterChanged={this.props.onCenterChanged}
                        fetchPosition={this.props.fetchPosition}
                    />
                </header>

                <div className="Screen-main">
                    <div className="max-width">
                        {this.props.isLocating &&
                            <div className="Box Box-row">
                                <div className="Box Box-item">
                                    <p>Finding your location...</p>
                                </div>
                            </div>
                        }
                        <div className="Box Box-row">
                            <div className="Box-item Box-item--noPadding">
                                <div className="Map">
                                    <MapBox
                                        style="mapbox://styles/richpoke/cj3478cqk002g2sqecso4xnz9"
                                        containerStyle={{
                                            height: "100%",
                                            width: "100%"
                                        }}
                                        center={[this.props.centre.lng, this.props.centre.lat]}
                                        zoom={[this.props.mapZoomLevel]}
                                        onDragEnd={this.onMapDragEnd}
                                        onZoomEnd={this.onZoomChanged}
                                        movingMethod="jumpTo"
                                        dragRotate={false}
                                    >
                                        <ZoomControl />
                                        {this.getMarkers(this.props.filteredPubs)}
                                        {this.getMarkers(this.props.filteredPubs, 'known')}
                                        {this.getFocusCircle()}
                                    </MapBox>

                                </div>
                            </div>
                        </div>
                        {this.props.pub &&
                            <div className="Box Box-row">
                                <div className="Box Box-item">
                                    <p>{this.props.pub.name.toUpperCase()}</p>
                                </div>
                            </div>
                        }

                        {this.props.pub &&
                            <PubDetail
                                pub={this.props.pub}
                                date={this.props.date}
                                updateTime={this.props.updateTime}
                                isSliderTipVisible={this.props.isSliderTipVisible}
                                hideSliderTip={this.props.hideSliderTip}
                            />
                        }

                    </div>
                </div>
            </div>
        )
    }
}

Locate.propTypes = {
    fetchPosition: React.PropTypes.func,
    isLocating: React.PropTypes.bool,
    centre: React.PropTypes.shape({
        lat: React.PropTypes.number,
        lng: React.PropTypes.number
    }),
    onCenterChanged: React.PropTypes.func,
    filteredPubs: React.PropTypes.object
}

export default Locate;


