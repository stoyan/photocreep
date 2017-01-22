import React, { Component } from 'react';
import './App.css';
const load = require('exifreader').load;

const bing = 'http://dev.virtualearth.net/REST/v1/Imagery/Map/Road/LATLONG/'+
  '15?pp=LATLONG&mapSize=500,500'+
  '&key=Ai_kb4YXmugLoiCy2Giijbk7My25iPiWt6YKREnN-Nvw9Ye9EiVcSjs2kI287_WB';

class App extends Component {
  
  constructor() {
    super();
    this.state = {
      files: [],
      data: [], // data about them files, after processing
    };
    document.documentElement.ondragenter = e => e.preventDefault();
    document.documentElement.ondragover = e => e.preventDefault();
    document.documentElement.ondrop = e => {
      e.preventDefault();
      this.update(e.dataTransfer.files);
    }
  }
  
  handleUploads(e) {
    this.update(e.target.files);
  }
  
  update(moreFiles) {
    const newFiles = Array.from(moreFiles);
    if (!newFiles) {
      return;
    }
    const files = this.state.files.concat(newFiles);
    this.setState({files});
    this.process(files);
  }
  
  process(files) {
    const data = this.state.data.slice();
    files.forEach((f, idx) => {
      if (!data[idx]) {
        var reader = new FileReader();
        reader.onload = (event) => {
          try {
            const tags = load(event.target.result);
            const lat = 
              (tags.GPSLatitudeRef.value[0] === 'S' ? '-' : '') + tags.GPSLatitude.description;
            const lon = 
              (tags.GPSLongitudeRef.value[0] === 'W' ? '-' : '') + tags.GPSLongitude.description;

            data[idx] = {
              mapUrl: bing.replace(/LATLONG/g, lat + ',' + lon),
              time: tags.DateTimeOriginal.description,
              latlon: {lat, lon},
              tags,
            };
          } catch (_) {
            data[idx] = {
              mapUrl: '-1',
            };
          }
          this.setState({data});
        };
        reader.readAsArrayBuffer(f.slice(0, 128 * 1024));
        
      }
    });
  }
  
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h1>Photo stalker creep</h1>
          <p>
            upload or drop some photos and see when and where they were taken<br/>
            then download your photo with no <em>meta</em> information in it
          </p>
        </div>
        <div className="Tool-in">
          <Uploads onChange={this.handleUploads.bind(this)} />
        </div>
        <div className="Tool-out">
          <Results files={this.state.files} data={this.state.data} />
        </div>
        <div className="App-footer">
          <p>
            Built with React, by <a href="https://twitter.com/stoyanstefanov">Stoyan</a>. 
            The <a href="http://phpied.com/photocreep">how, why, etc.</a> blog post. 
            The <a href="https://github.com/stoyan/photocreep">code is here</a>.
          </p>
          <p>
            To learn React and build stuff like this yourself, 
            get <a href="http://www.amazon.com/dp/1491931825/?tag=w3clubs-20">the best React book</a> to
            get up and running, written by yours truly.
          </p>
          <p>
            Hosting by <a href="https://www.dreamhost.com/r.cgi?447675">Dreamhost</a>,
            domain name by <a href="https://www.namecheap.com/?aff=107836">Namecheap</a>.
            Bye-bye now, take care then!
          </p>
        </div>
      </div>
    );
  }
}

const Uploads = ({onChange}) =>
  <div>
    <label htmlFor="files" className="Uploads-select" role="button">Select files...</label>
    <input 
      type="file" 
      id="files" 
      multiple 
      accept="image/*" 
      style={{display: 'none'}} 
      onChange={onChange}
    />
  </div>;


const Results = ({files, data}) => {
  if (files.length === 0) {return <span/>;}
  return (
    <table className="Results-table">
      <tbody>
      <tr><th width="33%">where</th><th width="33%">what</th><th width="33%">when, etc</th></tr>
      {files.map((f, idx) => {
        if (!f.type.startsWith('image/')) {
          return null;
        }
        return (
          <tr key={idx}>
            <td>{
              data[idx] && data[idx].mapUrl
                ? data[idx].mapUrl === '-1'
                  ? 'Lucky you! No geo location in this file.'
                  : <a href={`http://maps.apple.com/?ll=${data[idx].latlon.lat},${data[idx].latlon.lon}&q=Photo taken here`}>
                      <img alt={JSON.stringify(data[idx].latlon)} src={data[idx].mapUrl} />
                    </a>
                : '...'
            }</td>
            <td><img onLoad={ev => toCanvas(ev.target)} alt={f.name} data-id={idx} src={window.URL.createObjectURL(f)} /></td>
            <td style={{textAlign: 'left'}}>{
              data[idx] && data[idx].time
                ? <div>
                    <p>
                      Photo taken: <br/>
                      {data[idx].time}
                    </p>
                    <button onClick={() => popup(data[idx].tags)} className="Results-more">More photo data</button>
                    <button onClick={() => download(idx, f)} className="Results-download">Download clean</button>
                  </div>
                : '...'
            }</td>
          </tr>
        );
      })}
      </tbody>
    </table>
  );
}

function popup(what) {
  let msg = '';
  for (let key in what) {
    if (!what.hasOwnProperty(key)) return;
    msg += key + ': ' + what[key].description + '\n';
  }
  alert(msg);
  console.log(msg);
}

function download(idx, file) {
  var a = document.createElement('a');
  a.download = file.name;
  a.href = document.getElementById('image' + idx).toDataURL(file.type);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function toCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.setAttribute('id', 'image' + img.getAttribute('data-id'));
  var context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
  try {
    img.parentNode.replaceChild(canvas, img);
  } catch (_) {
    // hack, obv
  }
}

export default App;
