/**
 * Created by Michael on 17/03/14.
 */
angular.module('drawACat.draw.services')

.factory('catBuilder', function(catFactory, primitives, behaviourFactory) {

        /**
         * Takes the catParts object which is generated by the drawHelper service, and populated with data by the DrawController, and processes it
         * into a Cat which can then be saved.
         *
         * @returns Cat
         * @param catParts
         */
        var buildCatFromParts = function(catParts) {
            var minimumCoordinates = getMinimumCoordinates(catParts);
            var minX = minimumCoordinates.x;
            var minY = minimumCoordinates.y;

            var normalCat = catFactory.newCat();

            angular.forEach(catParts, function(partTemplate, partName) {
                var partPath = catParts[partName].lineCollection.getPath();
                var normalizedPath = normalizePath(partPath, minX, minY);

                var newPart = primitives.Part();
                newPart.createFromPath(partName, normalizedPath);
                normalCat.bodyParts[partName].part = newPart;

                var newBehaviour = behaviourFactory.newBehaviour();
                newBehaviour = applyBehaviourTemplate(newBehaviour, partTemplate.behaviour);
                normalCat.bodyParts[partName].behaviour = newBehaviour;
            });

            // now we need to loop through the bodyParts once more to resolve the parent/child relationships
            angular.forEach(catParts, function(partTemplate, partName) {
                if(partTemplate.parentPart) {
                    normalCat.bodyParts[partName].part.setParent(normalCat.bodyParts[partTemplate.parentPart].part);
                }
            });

            return normalCat;
        };

        /**
         * Calculate the minimum x and y coordinates of all the lines in the catParts object.
         * @param catParts
         * @returns {{x: number, y: number}}
         */
        var getMinimumCoordinates = function(catParts) {
            var minXCandidates = [];
            var minYCandidates = [];

            angular.forEach(catParts, function(catPart) {
                var partPath = catPart.lineCollection.getPath();

                angular.forEach(partPath, function(line) {
                    var minXCandidate = line.reduce(function(min, point) {
                        return Math.min(min, point[0]);
                    }, Infinity);
                    minXCandidates.push(minXCandidate);

                    var minYCandidate = line.reduce(function(min, point) {
                        return Math.min(min, point[1]);
                    }, Infinity);
                    minYCandidates.push(minYCandidate);
                });
            });

            var minX = Math.min.apply(null, minXCandidates);
            var minY = Math.min.apply(null, minYCandidates);

            return {
                x: minX,
                y: minY
            };
        };

        /**
         * Make the cat's path origin start from coordinate 0,0. This will allow us to properly position the cat when it is
         * subsequently rendered.
         *
         * @param partPath
         * @param minX
         * @param minY
         * @returns {*|Array}
         */
        var normalizePath = function(partPath, minX, minY) {
            return partPath.map(function(line) {
                return line
                    // TODO: smart algorithm to smooth line and remove unnecessary points
                    /*.filter(function(point, index) {
                        // filter out every other element (starting from the second element) to reduce the amount of
                        // data to be stored. Has no visible effect of the rendered shapes, but halves the storage space required
                        // and vastly speeds up rendering.
                        return (index + 1) % 2 === 0;
                    })*/
                    .map(function(point) {
                        // subtract the minX and minY values from each coordinate so that the cat is aligned to the top left
                        // of the x/y origin point.
                        return [
                            point[0] - minX,
                            point[1] - minY
                        ];
                    });
            });
        };
        var applyBehaviourTemplate = function(newBehaviour, templateBehaviour) {
            if (templateBehaviour) {
                if (templateBehaviour.sensitivity) {
                    newBehaviour.setSensitivity(templateBehaviour.sensitivity);
                }
                if (templateBehaviour.range) {
                    newBehaviour.range = templateBehaviour.range;
                }
                if (templateBehaviour.visible) {
                    newBehaviour.visible = templateBehaviour.visible;
                }
            }

            return newBehaviour;
        };

        return {
            buildCatFromParts: buildCatFromParts
        };
    });