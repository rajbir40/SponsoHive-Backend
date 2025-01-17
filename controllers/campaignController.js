const Campaign = require('../models/Campaign');
const { scheduleCampaign } = require('../utils/schedulerService');
const Recipient = require("../models/Recipient"); 

/**
 * Schedule a new campaign.
 */
exports.scheduleCampaign = async (req, res) => {
  try {
    const { name, emailListId, schedule } = req.body;

    // Validate inputs
    if (!name || !emailListId || !schedule) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Create a new campaign
    const campaign = new Campaign({
      name,
      emailListId,
      schedule: new Date(schedule),
    });

    await campaign.save();

    // Schedule the campaign
    scheduleCampaign(campaign);

    return res.status(201).json({
      message: 'Campaign scheduled successfully.',
      campaign,
    });
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateFollowUpSettings = async (req, res) => {
  const { campaignId, followUpInterval } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.follow_up = followUpInterval;
    await campaign.save();

    res.status(200).json({ message: 'Follow-up interval updated successfully', campaign });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating follow-up settings' });
  }
};

exports.previewEmail = async (req, res) => {
  try {
    const { template, recipientId } = req.body;

    if (!template || !recipientId) {
      return res.status(400).json({ message: "Template and recipient ID are required." });
    }
    const recipient = await Recipient.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    // Replace placeholders in the template
    const placeholderRegex = /\{\{(.*?)\}\}/g; // Matches {{key}}
    const preview = template.replace(placeholderRegex, (match, key) => {
      return recipient[key.trim()] || `[${key.trim()} missing]`;
    });

    res.status(200).json({ preview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while generating the email preview." });
  }
};