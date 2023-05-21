const fs = require('fs');
const path = require('path');

const lib = {};

lib.basedir = path.join(__dirname, '/../.data/');

// write data to file
lib.create = (dir, file, data, callback) => {
    // open file for writing
    fs.open(`${lib.basedir + dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            // convert data to string
            const stringData = JSON.stringify(data);

            // write data to the file and then close
            fs.writeFile(fileDescriptor, stringData, (err)=> {
                if(!err){
                    fs.close(fileDescriptor, (err) => {
                        if(!err){
                            callback(false);
                        } else {
                            callback('error closing the file');
                        }
                    });

                } else {
                    callback('error writing to new file');
                }

            });
        } else {
            callback('Could not create new file , it may be exits already..');
        }

    });
};

// read data
lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.basedir + dir}/${file}.json`, 'utf-8', (err, data) => {
        callback(err, data);

    });
};

// update data
lib.update = (dir, file, data, callback) => {
    fs.open(`${lib.basedir + dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.ftruncate(fileDescriptor, (err) => {
                if(!err) {
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if(!err) {
                            fs.close(fileDescriptor, (err) => {
                                if(!err) {
                                    callback(false);
                                    //console.log('-----------', fileDescriptor);
                                } else {
                                    callback('not able to close the file');
                                }
                            });
                        } else {
                            console.log('not able to write in the file');
                        }
                    });
                } else {
                    callback('not updating the file');
                }
            });

        } else {
            callback('Could not open the existing file');

        }
    });
};

// delete file
lib.delete = (dir, file, callback) => {
    fs.unlink(`${lib.basedir + dir}/${file}.json`, (err) => {
        if(!err) {
            callback(false);
        } else {
            callback('error while trying to delete the file...');
        }
    });
};

lib.list = (dir, callback) => {
    fs.readdir(`${lib.basedir + dir}/`,(err,fileName)=> {
        if(!err && fileName && fileName.length > 0) {
            let trimmedFileName = [];
            fileName.forEach(fileName => {
                trimmedFileName.push(fileName.replace('.json', ''));

            });
            callback(false, trimmedFileName);
        } else {
            callback('error reading directory');
        }
    });
};






module.exports = lib;