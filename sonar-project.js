// const sonarqubeScanner = require('sonarqube-scanner');
// sonarqubeScanner({
//     serverUrl: 'http://localhost:9000',
//     options : {
//     'sonar.sources': 'src',
//     'sonar.test': 'test',
//     'sonar.javascript.lcov.reportPaths':  'coverage/lcov.info',
//     'sonar.testExecutionReportPaths':  'coverage/test-reporter.xml',
//     'sonar.inclusions'  :  '**' // Entry point of your code
//     }
  // }, () => {});

  const sonarqubeScanner =  require('sonarqube-scanner');
sonarqubeScanner(
    {
        serverUrl:  'http://localhost:9000',
        options : {
            'sonar.sources':  'src',
            'sonar.tests':  'test',
            'sonar.inclusions'  :  '**', // Entry point of your code
            'sonar.test.inclusions':  'src/**/*.spec.js,src/**/*.spec.jsx,src/**/*.test.js,src/**/*.test.jsx',
            'sonar.javascript.lcov.reportPaths':  'coverage/lcov.info',
            'sonar.testExecutionReportPaths':  'coverage/test-reporter.xml'
        }
    }, () => {});