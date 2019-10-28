import * as Yup from 'yup'
import { parseISO, isBefore, startOfDay, endOfDay } from 'date-fns'
import { Op } from 'sequelize'

import Meetup from '../models/Meetup'
import User from '../models/User'
import File from '../models/File'

class MeetUpController {
  async index(req, res) {
    const { page = 1, date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Invalid date' })
    }

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(parseISO(date)), endOfDay(parseISO(date))],
        },
      },
      order: ['date'],
      attributes: ['id', 'title', 'description', 'localization', 'date'],
      limit: 10,
      offset: 10 * page - 10,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    })
    return res.json(meetups)
  }

  async getItem(req, res) {
    const { id } = req.params

    const meetup = await Meetup.findOne({
      where: { id, user_id: req.userId },
      attributes: ['id', 'title', 'description', 'localization', 'date'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    })

    if (!meetup) {
      return res.status(400).json({ error: "Meetup  doesn't exist " })
    }

    return res.json(meetup)
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      banner_id: Yup.number().required(),
      description: Yup.string().required(),
      localization: Yup.string().required(),
      date: Yup.date().required(),
    })

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' })
    }

    const user = await User.findByPk(req.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    /*
     * Check for past dates
     */
    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' })
    }

    const meetup = await Meetup.create({
      ...req.body,
      user_id: req.userId,
    })

    return res.json(meetup)
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      localization: Yup.string(),
      date: Yup.date(),
      banner_id: Yup.number(),
    })

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' })
    }

    /*
     * Check organizer
     */
    const meetup = await Meetup.findOne({
      where: { id: req.params.id, user_id: req.userId },
    })

    if (!meetup) {
      return res
        .status(400)
        .json({ error: 'You can only update meetup you created' })
    }

    const file = await File.findByPk(req.body.banner_id)

    /*
     * Check banner
     */
    if (!file) {
      return res.status(400).json({ error: 'Banner not found' })
    }

    /*
     * Check date invalid
     */
    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' })
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't update past meetups." })
    }

    await meetup.update(req.body)

    return res.json(meetup)
  }

  async delete(req, res) {
    /*
     * Check organizer
     */
    const meetup = await Meetup.findOne({
      where: { id: req.params.id, user_id: req.userId },
    })

    if (!meetup) {
      return res
        .status(400)
        .json({ error: 'You can only update meetup you created' })
    }

    /*
     * Check for past dates
     */
    if (meetup.past) {
      return res.status(400).json({ error: "Can't update past meetups." })
    }

    await meetup.destroy()

    return res.send()
  }
}

export default new MeetUpController()
