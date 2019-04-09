const { matchDeep } = require('../../driver/test/cypress/plugins/snapshot/command')
const { Snapshot } = require('../../driver/test/cypress/plugins/snapshot')
const chai = require('chai')
const _ = require('lodash')
const sinon = require('sinon')
const Debug = require('debug')
const debug = Debug('plugin:snapshot')

/** @type {Mocha.ITest} */
let currentTest

const registerInMocha = () => {

  const { getSnapshot, saveSnapshot, snapshotRestore } = new Snapshot()

  global.beforeEach(function () {
    snapshotRestore()
    if (this.currentTest) {
      currentTest = this.currentTest
    }
  })

  const matchSnapshot = function (m, snapshotName) {
    const ctx = this
    const specName = currentTest.fullTitle()
    const file = currentTest.file
    const exactSpecName = snapshotName

    const exp = getSnapshot({
      file,
      specName,
      exactSpecName,
    })

    try {
      matchDeep.call(ctx, m, exp, { message: 'to match snapshot', chai, setGlobalSnapshot: _.noop, sinon })
    } catch (e) {
      if (_.has(e, 'act')) {
        if (process.env['SNAPSHOT_UPDATE']) {

          saveSnapshot({
            file,
            specName,
            exactSpecName,
            what: e.act,
          })

          return
        }
      }

      throw e
    }
  }

  const matchDeepMocha = function (...args) {

    let ret
    let act

    try {
      ret = matchDeep.apply(this, [args[0], args[1], { chai, setGlobalSnapshot: _.noop, sinon, onlyExpected: true }])
      act = ret.act
    } catch (e) {
      if (e.act) {
        act = e.act
      }

      throw e
    } finally {
      if (this.__flags.debug) {
        console.info(act)
      }
    }

    return ret
  }

  chai.Assertion.addMethod('matchSnapshot', matchSnapshot)
  chai.Assertion.addMethod('matchDeep', matchDeepMocha)

  chai.Assertion.addProperty('debug', function () {
    this.__flags.debug = true
    // debug(this)
  })
}

module.exports = {
  registerInMocha,
}